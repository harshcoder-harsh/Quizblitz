import { motion } from "framer-motion";
import useAuthStore from "../store/authStore";

export default function PlayerList({ players = [], hostId }) {
  const myId = useAuthStore((s) => s.user?.id);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {players.map((p, i) => {
        const isMe = p.id === myId;
        const isHost = p.id === hostId;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
              ${isMe ? "border-brand-500 bg-brand-500/10" : "border-surface-600 bg-surface-800"}`}
          >
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative"
              style={{ background: `hsl(${(p.username?.charCodeAt(0) || 65) * 5}, 60%, 35%)` }}
            >
              {p.username?.[0]?.toUpperCase()}
              {isHost && (
                <span className="absolute -top-1 -right-1 text-xs bg-amber-500 rounded-full w-4 h-4 flex items-center justify-center">
                  👑
                </span>
              )}
            </div>
            <div className="text-center">
              <p className={`text-sm font-semibold truncate max-w-[80px] ${isMe ? "text-brand-400" : "text-white"}`}>
                {p.username}
              </p>
              <div className="flex gap-1 justify-center mt-0.5">
                {isHost && <span className="text-xs text-amber-400">Host</span>}
                {p.isGuest && <span className="text-xs text-gray-500">Guest</span>}
                {isMe && <span className="text-xs text-brand-400">You</span>}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
