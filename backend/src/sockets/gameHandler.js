const Room = require("../models/Room");
const User = require("../models/User");
const GameResult = require("../models/GameResult");
const Question = require("../models/Question");
const { getRoomState, setRoomState, updateRoomState, deleteRoomState } = require("../redis/roomState");
const { getQuestionsForRoom } = require("../services/questionService");
const { calculateScore, buildLeaderboard } = require("../services/scoreService");

function sanitizeQuestion(question) {
  return {
    id: question._id,
    questionText: question.questionText,
    type: question.type,
    difficulty: question.difficulty,
    category: question.category,
    options: question.options.map((o) => ({ id: o._id, optionText: o.optionText })),
  };
}

function registerGameHandlers(io, socket) {
  const user = socket.user;

  socket.on("joinRoom", async ({ code }) => {
    try {
      const state = await getRoomState(code);
      if (!state) return socket.emit("error", { message: "Room not found" });
      if (state.status !== "WAITING") return socket.emit("error", { message: "Game already in progress" });

      const playerCount = Object.keys(state.players).length;
      const room = await Room.findOne({ code });
      if (!room) return socket.emit("error", { message: "Room not found" });
      if (playerCount >= room.maxPlayers) return socket.emit("error", { message: "Room is full" });

      socket.join(code);

      await updateRoomState(code, (s) => ({
        ...s,
        players: {
          ...s.players,
          [user.id]: {
            id: user.id,
            username: user.username,
            isGuest: user.isGuest || false,
            score: 0,
            correctAns: 0,
            wrongAns: 0,
            socketId: socket.id,
            rank: playerCount + 1,
          },
        },
      }));

      const updated = await getRoomState(code);
      const players = Object.values(updated.players);

      io.to(code).emit("roomUpdate", {
        players,
        settings: updated.settings,
        hostId: updated.hostId,
        code,
      });

      socket.emit("joinedRoom", {
        code,
        roomId: updated.roomId,
        hostId: updated.hostId,
        players,
        settings: updated.settings,
      });

      socket.data.roomCode = code;
    } catch (err) {
      console.error("joinRoom error:", err);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("leaveRoom", async ({ code }) => {
    await handleLeave(io, socket, code);
  });

  socket.on("disconnect", async () => {
    const code = socket.data.roomCode;
    if (code) await handleLeave(io, socket, code);
  });

  socket.on("startGame", async ({ code }) => {
    try {
      const state = await getRoomState(code);
      if (!state) return socket.emit("error", { message: "Room not found" });
      if (state.hostId.toString() !== user.id.toString()) {
        return socket.emit("error", { message: "Only the host can start the game" });
      }
      if (state.status !== "WAITING") return socket.emit("error", { message: "Game already started" });

      const playerCount = Object.keys(state.players).length;
      if (playerCount < 1) return socket.emit("error", { message: "Need at least 1 player to start" });

      const { categoryId, difficulty, questionCount } = state.settings;
      const questions = await getQuestionsForRoom(categoryId, difficulty, questionCount);

      if (questions.length === 0) {
        return socket.emit("error", { message: "Not enough questions for this category and difficulty. Try a different combination." });
      }

      await setRoomState(code, {
        ...state,
        status: "ACTIVE",
        questions,
        currentQuestionIndex: -1,
        answers: {},
      });

      await Room.updateOne({ code }, { status: "ACTIVE" });

      io.to(code).emit("gameStarted", { totalQuestions: questions.length, settings: state.settings });

      setTimeout(() => sendNextQuestion(io, code), 1000);
    } catch (err) {
      console.error("startGame error:", err);
      socket.emit("error", { message: "Failed to start game" });
    }
  });

  socket.on("submitAnswer", async ({ code, optionId, timeTaken }) => {
    try {
      const state = await getRoomState(code);
      if (!state || state.status !== "ACTIVE") return;

      const qi = state.currentQuestionIndex;
      if (qi < 0 || qi >= state.questions.length) return;

      if (state.answers[qi]?.[user.id]) return;

      const question = state.questions[qi];
      const correctOption = question.options.find((o) => o.isCorrect);
      // Handle the case where optionId might be string or ObjectId
      const isCorrect = correctOption && optionId.toString() === correctOption._id.toString();
      const timeLimit = state.settings.timerSeconds;
      const points = isCorrect ? calculateScore(state.settings.difficulty, timeTaken, timeLimit) : 0;

      await updateRoomState(code, (s) => {
        const updatedPlayers = { ...s.players };
        if (updatedPlayers[user.id]) {
          updatedPlayers[user.id] = {
            ...updatedPlayers[user.id],
            score: updatedPlayers[user.id].score + points,
            correctAns: updatedPlayers[user.id].correctAns + (isCorrect ? 1 : 0),
            wrongAns: updatedPlayers[user.id].wrongAns + (isCorrect ? 0 : 1),
          };
        }
        const updatedAnswers = { ...s.answers };
        if (!updatedAnswers[qi]) updatedAnswers[qi] = {};
        updatedAnswers[qi][user.id] = { optionId, isCorrect, timeTaken, points };

        return { ...s, players: updatedPlayers, answers: updatedAnswers };
      });

      socket.emit("answerResult", {
        correct: isCorrect,
        points,
        correctOptionId: correctOption?._id,
      });

      const newState = await getRoomState(code);
      const leaderboard = buildLeaderboard(newState.players);
      io.to(code).emit("leaderboardUpdate", leaderboard);

      const answerCount = Object.keys(newState.answers[qi] || {}).length;
      const playerCount = Object.keys(newState.players).length;
      if (answerCount >= playerCount) {
        clearRoomTimer(code);
        setTimeout(() => revealAndAdvance(io, code), 1500);
      }
    } catch (err) {
      console.error("submitAnswer error:", err);
    }
  });

  socket.on("kickPlayer", async ({ code, userId }) => {
    try {
      const state = await getRoomState(code);
      if (!state || state.hostId.toString() !== user.id.toString()) return;

      const targetPlayer = state.players[userId];
      if (!targetPlayer) return;

      await updateRoomState(code, (s) => {
        const players = { ...s.players };
        delete players[userId];
        return { ...s, players };
      });

      const targetSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.data.roomCode === code && s.user?.id.toString() === userId.toString()
      );
      if (targetSocket) {
        targetSocket.emit("playerKicked", { userId, username: targetPlayer.username });
        targetSocket.leave(code);
        targetSocket.data.roomCode = null;
      }

      const updated = await getRoomState(code);
      io.to(code).emit("roomUpdate", { players: Object.values(updated.players), hostId: updated.hostId });
    } catch (err) {
      console.error("kickPlayer error:", err);
    }
  });

  socket.on("reportQuestion", async ({ questionId, reason }) => {
    try {
      await Question.findByIdAndUpdate(questionId, { $inc: { reportCount: 1 } });
      socket.emit("questionReported", { message: "Thanks for your report! We'll review it shortly." });
    } catch (err) {
      console.error("reportQuestion error:", err);
    }
  });
}

const roomTimers = {};

function clearRoomTimer(code) {
  if (roomTimers[code]) {
    clearTimeout(roomTimers[code]);
    delete roomTimers[code];
  }
}

async function sendNextQuestion(io, code) {
  const state = await getRoomState(code);
  if (!state || state.status !== "ACTIVE") return;

  const nextIndex = state.currentQuestionIndex + 1;

  if (nextIndex >= state.questions.length) {
    await endGame(io, code);
    return;
  }

  await updateRoomState(code, (s) => ({ ...s, currentQuestionIndex: nextIndex }));

  const question = state.questions[nextIndex];
  const timeLimit = state.settings.timerSeconds;

  io.to(code).emit("nextQuestion", {
    question: sanitizeQuestion(question),
    questionNumber: nextIndex + 1,
    total: state.questions.length,
    timeLimit,
  });

  clearRoomTimer(code);
  roomTimers[code] = setTimeout(() => revealAndAdvance(io, code), timeLimit * 1000 + 500);
}

async function revealAndAdvance(io, code) {
  clearRoomTimer(code);
  const state = await getRoomState(code);
  if (!state || state.status !== "ACTIVE") return;

  const qi = state.currentQuestionIndex;
  if (qi < 0 || qi >= state.questions.length) return;

  const question = state.questions[qi];
  const correctOption = question.options.find((o) => o.isCorrect);

  io.to(code).emit("answerReveal", {
    correctOptionId: correctOption?._id,
    explanation: question.explanation || null,
    referenceUrl: question.referenceUrl || null,
  });

  const leaderboard = buildLeaderboard(state.players);
  io.to(code).emit("leaderboardUpdate", leaderboard);

  setTimeout(() => sendNextQuestion(io, code), 4000);
}

async function endGame(io, code) {
  clearRoomTimer(code);
  const state = await getRoomState(code);
  if (!state) return;

  const finalLeaderboard = buildLeaderboard(state.players);
  const winner = finalLeaderboard[0] || null;

  io.to(code).emit("gameOver", { finalScores: finalLeaderboard, winner });

  try {
    const room = await Room.findOne({ code });
    if (room) {
      await Room.updateOne({ code }, { status: "FINISHED" });

      for (const player of finalLeaderboard) {
        if (player.isGuest) continue;
        await GameResult.create({
          roomId: room._id,
          userId: player.id,
          score: player.score,
          rank: player.rank,
          correctAns: player.correctAns,
          wrongAns: player.wrongAns,
        });
        await User.findByIdAndUpdate(player.id, {
          $inc: {
            totalScore: player.score,
            gamesPlayed: 1
          }
        });
      }
    }
  } catch (err) {
    console.error("Error persisting game results:", err);
  }

  await deleteRoomState(code);
}

async function handleLeave(io, socket, code) {
  try {
    socket.leave(code);
    const userId = socket.user?.id;

    const state = await getRoomState(code);
    if (!state || !state.players[userId]) return;

    const leavingUsername = state.players[userId]?.username;

    await updateRoomState(code, (s) => {
      const players = { ...s.players };
      delete players[userId];
      let newHostId = s.hostId;
      if (s.hostId.toString() === userId.toString()) {
        const remaining = Object.keys(players);
        newHostId = remaining.length > 0 ? remaining[0] : null;
      }
      return { ...s, players, hostId: newHostId };
    });

    const updated = await getRoomState(code);
    if (!updated) return;

    const players = Object.values(updated.players);

    if (players.length === 0) {
      await deleteRoomState(code);
      try { await Room.updateOne({ code }, { status: "FINISHED" }); } catch {  }
      return;
    }

    io.to(code).emit("roomUpdate", { players, hostId: updated.hostId });

    if (updated.hostId.toString() !== state.hostId.toString()) {
      io.to(code).emit("hostChanged", { newHostId: updated.hostId, previousHostUsername: leavingUsername });
    }
    socket.data.roomCode = null;
  } catch (err) {
    console.error("handleLeave error:", err);
  }
}

module.exports = { registerGameHandlers };
