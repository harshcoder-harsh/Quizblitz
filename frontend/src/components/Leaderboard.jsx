import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";

export default function Leaderboard({ players = [], compact = false }) {
  const myId = useAuthStore((s) => s.user?.id);

  const rankColors = ["#f59e0b", "#94a3b8", "#b45309"];
  const rankEmoji  = ["🥇", "🥈", "🥉"];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-surface-600 flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <h3 className="font-bold text-white">Live Leaderboard</h3>
      </div>
      <div className={`divide-y divide-surface-700 ${compact ? "max-h-64 overflow-y-auto" : ""}`}>
        <AnimatePresence initial={false}>
          {players.map((p, i) => {
            const isMe = p.id === myId;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-brand-500/10" : ""}`}
              >
                {/* Rank */}
                <div className="w-7 text-center">
                  {i < 3 ? (
                    <span className="text-lg">{rankEmoji[i]}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-500">#{i + 1}</span>
                  )}
                </div>

                {/* Avatar placeholder */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `hsl(${(p.username?.charCodeAt(0) || 65) * 5}, 60%, 40%)` }}
                >
                  {p.username?.[0]?.toUpperCase()}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isMe ? "text-brand-400" : "text-white"}`}>
                    {p.username} {isMe && <span className="text-xs">(you)</span>}
                    {p.isGuest && <span className="ml-1 text-xs text-gray-500">guest</span>}
                  </p>
                </div>

                {/* Score */}
                <motion.span
                  key={p.score}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-sm tabular-nums"
                  style={{ color: i < 3 ? rankColors[i] : "#94a3b8" }}
                >
                  {p.score.toLocaleString()}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {players.length === 0 && (
          <p className="text-center text-gray-500 py-8 text-sm">No players yet</p>
        )}
      </div>
    </div>
  );
}
