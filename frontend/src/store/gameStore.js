import { create } from "zustand";

const useGameStore = create((set) => ({
  room: null,
  players: [],
  hostId: null,

  gameState: "idle", 
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 0,
  timeLimit: 20,

  selectedOptionId: null,
  answerResult: null,   
  answerReveal: null,   

  leaderboard: [],
  finalScores: [],
  winner: null,

  myScore: 0,

  setRoom(room)            { set({ room }); },
  setPlayers(players)      { set({ players }); },
  setHostId(hostId)        { set({ hostId }); },
  setGameState(gameState)  { set({ gameState }); },

  setCurrentQuestion(question, questionNumber, totalQuestions, timeLimit) {
    set({
      currentQuestion: question,
      questionNumber,
      totalQuestions,
      timeLimit,
      selectedOptionId: null,
      answerResult: null,
      answerReveal: null,
      gameState: "playing",
    });
  },

  setSelectedOption(optionId) { set({ selectedOptionId: optionId }); },

  setAnswerResult(result) {
    set((s) => ({
      answerResult: result,
      myScore: s.myScore + (result.points || 0),
    }));
  },

  setAnswerReveal(data) {
    set({ answerReveal: data, gameState: "revealing" });
  },

  setLeaderboard(leaderboard) { set({ leaderboard }); },

  setGameOver(finalScores, winner) {
    set({ finalScores, winner, gameState: "finished" });
  },

  reset() {
    set({
      room: null, players: [], hostId: null,
      gameState: "idle", currentQuestion: null,
      questionNumber: 0, totalQuestions: 0, timeLimit: 20,
      selectedOptionId: null, answerResult: null, answerReveal: null,
      leaderboard: [], finalScores: [], winner: null, myScore: 0,
    });
  },
}));

export default useGameStore;
