import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";
import useGameStore from "../store/gameStore";
import { useSocket, emitSocket } from "../hooks/useSocket";
import PlayerList from "../components/PlayerList";
import CategoryBadge from "../components/CategoryBadge";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { players, hostId, room, setPlayers, setHostId, setRoom, reset } = useGameStore();

  const isHost = user?.id === hostId;

  // Join room on mount
  useEffect(() => {
    if (!token) return;
    // Fetch room details
    axios.get(`${API}/api/rooms/${code}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setRoom(r.data.room))
      .catch(() => toast.error("Room not found"));

    emitSocket("joinRoom", { code });

    return () => {
      // Don't emit leaveRoom on unmount if navigating to game
    };
  }, [code, token]);

  // Socket events
  useSocket("joinedRoom", ({ players: p, hostId: h, settings }) => {
    setPlayers(p);
    setHostId(h);
  }, []);

  useSocket("roomUpdate", ({ players: p, hostId: h }) => {
    setPlayers(p);
    setHostId(h);
  }, []);

  useSocket("gameStarted", ({ totalQuestions, settings }) => {
    useGameStore.getState().setGameState("playing");
    navigate(`/game/${code}`);
  }, [code, navigate]);

  useSocket("playerKicked", ({ userId }) => {
    if (userId === user?.id) {
      toast.error("You were kicked from the room");
      reset();
      navigate("/");
    }
  }, [user?.id]);

  useSocket("hostChanged", ({ newHostId, previousHostUsername }) => {
    setHostId(newHostId);
    toast(`👑 ${previousHostUsername} left. You are now the host!`, { icon: "👑" });
  }, []);

  useSocket("error", ({ message }) => toast.error(message), []);

  function handleStart() {
    emitSocket("startGame", { code });
  }

  function handleKick(playerId) {
    emitSocket("kickPlayer", { code, userId: playerId });
  }

  function handleLeave() {
    emitSocket("leaveRoom", { code });
    reset();
    navigate("/");
  }

  function copyCode() {
    navigator.clipboard.writeText(code);
    toast.success("Room code copied!");
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Game Lobby</h1>
            <p className="text-gray-400 text-sm mt-1">Waiting for host to start...</p>
          </div>
          <button onClick={handleLeave} className="btn-ghost btn text-sm">← Leave</button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Room info + controls */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {/* Room Code */}
            <div className="card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Room Code</p>
              <button onClick={copyCode} className="group flex items-center gap-3 w-full">
                <span className="font-mono text-4xl font-black text-white tracking-widest">{code}</span>
                <span className="text-gray-500 group-hover:text-brand-400 transition-colors text-lg">📋</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">Click to copy · Share with friends</p>
            </div>

            {/* Settings */}
            {room && (
              <div className="card p-5 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Settings</p>
                {room.category && (
                  <CategoryBadge icon={room.category.icon} name={room.category.name} color={room.category.color} />
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-surface-700 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Difficulty</p>
                    <p className="text-white font-bold text-xs mt-0.5">{room.difficulty}</p>
                  </div>
                  <div className="bg-surface-700 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Questions</p>
                    <p className="text-white font-bold text-xs mt-0.5">{room.questionCount}</p>
                  </div>
                  <div className="bg-surface-700 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Timer</p>
                    <p className="text-white font-bold text-xs mt-0.5">{room.timerSeconds}s</p>
                  </div>
                  <div className="bg-surface-700 rounded-lg p-2 text-center">
                    <p className="text-gray-400 text-xs">Max Players</p>
                    <p className="text-white font-bold text-xs mt-0.5">{room.maxPlayers}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Host controls */}
            {isHost && (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card p-5">
                <p className="text-xs text-amber-400 uppercase tracking-wider font-medium mb-3">👑 Host Controls</p>
                <button id="start-game-btn" onClick={handleStart}
                  className="btn-primary btn w-full py-3 text-base animate-glow">
                  ⚡ Start Game
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  {players.length} player{players.length !== 1 ? "s" : ""} ready
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Players */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <div className="card p-5">
              <div className="flex flex-col mb-4 gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white">Players ({players.length})</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-gray-400">Live</span>
                  </div>
                </div>
                {room?.isTeacherMode && isHost && (
                  <div className="text-xs p-2 rounded bg-brand-500/20 border border-brand-500/30 text-brand-300">
                    👩‍🏫 You are in Teacher Mode. You will manage the room without answering.
                  </div>
                )}
              </div>
              <PlayerList players={players} hostId={hostId} />

              {/* Kick buttons for host */}
              {isHost && players.length > 1 && (
                <div className="mt-4 pt-4 border-t border-surface-600">
                  <p className="text-xs text-gray-500 mb-2">Kick a player:</p>
                  <div className="flex flex-wrap gap-2">
                    {players.filter((p) => p.id !== user?.id).map((p) => (
                      <button key={p.id} onClick={() => handleKick(p.id)} className="btn-danger btn text-xs py-1 px-2">
                        ✕ {p.username}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
