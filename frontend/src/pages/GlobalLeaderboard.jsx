import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function GlobalLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/leaderboard/global`)
      .then((r) => setLeaderboard(r.data.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors text-sm">
            ← Back to Home
          </Link>
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-4xl font-black text-white mb-2">Global Leaderboard</h1>
          <p className="text-gray-400">All-time top players across every game</p>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-4xl mb-3">📭</p>
              <p>No games played yet. Be the first!</p>
              <Link to="/" className="btn-primary btn mt-4 mx-auto inline-flex">Play Now</Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-700">
              {leaderboard.map((player, i) => (
                <motion.div key={player.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-surface-700/30 transition-colors">
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {i === 0 ? <span className="text-2xl">🥇</span> :
                     i === 1 ? <span className="text-2xl">🥈</span> :
                     i === 2 ? <span className="text-2xl">🥉</span> :
                     <span className="text-gray-500 font-bold text-sm">#{i + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
                    style={{ background: `hsl(${(player.username?.charCodeAt(0) || 65) * 5}, 60%, 38%)` }}>
                    {player.username?.[0]?.toUpperCase()}
                  </div>

                  {/* Name + games */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{player.username}</p>
                    <p className="text-xs text-gray-500">{player.gamesPlayed} game{player.gamesPlayed !== 1 ? "s" : ""} played</p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${i < 3 ? "text-amber-400" : "text-white"}`}>
                      {player.totalScore.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">total pts</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="text-center mt-8">
          <Link to="/" className="btn-primary btn text-base px-8 py-3">⚡ Play Now</Link>
        </div>
      </div>
    </div>
  );
}
