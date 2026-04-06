import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import useGameStore from "../store/gameStore";
import useAuthStore from "../store/authStore";
import Podium from "../components/Podium";

export default function Results() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { finalScores, winner, myScore, reset } = useGameStore();
  const { user } = useAuthStore();

  const myRank = finalScores.find((p) => p.id === user?.id);

  function handlePlayAgain() {
    reset();
    navigate("/");
  }

  if (finalScores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No results found</p>
          <Link to="/" className="btn-primary btn">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Game Over! 🎉</h1>
          {winner && (
            <p className="text-xl text-amber-400 font-semibold">
              🏆 {winner.username} wins with {winner.score.toLocaleString()} pts!
            </p>
          )}
          {myRank && (
            <p className="text-gray-400 mt-2">
              You finished <span className="text-white font-bold">#{myRank.rank}</span> with{" "}
              <span className="text-brand-400 font-bold">{myScore.toLocaleString()} pts</span>
            </p>
          )}
        </motion.div>

        {/* Podium */}
        <Podium players={finalScores} />

        {/* Full Scoreboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="card mt-10 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-600">
            <h2 className="font-bold text-white text-lg">📊 Full Scoreboard</h2>
          </div>
          <div className="divide-y divide-surface-700">
            {finalScores.map((p, i) => {
              const isMe = p.id === user?.id;
              return (
                <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.05 }}
                  className={`flex items-center gap-4 px-6 py-4 ${isMe ? "bg-brand-500/10" : ""}`}>
                  <span className="text-2xl w-8 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-gray-500 text-sm">#{i + 1}</span>}
                  </span>

                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ background: `hsl(${(p.username?.charCodeAt(0) || 65) * 5}, 60%, 38%)` }}>
                    {p.username?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <p className={`font-semibold ${isMe ? "text-brand-400" : "text-white"}`}>
                      {p.username} {isMe && <span className="text-xs">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      ✓ {p.correctAns} correct · ✗ {p.wrongAns} wrong
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg text-white">{p.score.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="flex gap-3 justify-center mt-8">
          <button onClick={handlePlayAgain} className="btn-primary btn text-base px-8 py-3">
            🔁 Play Again
          </button>
          <Link to="/leaderboard" className="btn-secondary btn text-base px-8 py-3">
            🏆 Global Leaderboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
