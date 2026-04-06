import { motion } from "framer-motion";

const MEDALS = ["🥇", "🥈", "🥉"];
const HEIGHTS = ["h-36", "h-24", "h-28"];
const PODIUM_ORDER = [1, 0, 2]; // center (1st), left (2nd), right (3rd)

export default function Podium({ players = [] }) {
  const top3 = players.slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-4 mt-8">
      {PODIUM_ORDER.map((rankIdx) => {
        const player = top3[rankIdx];
        if (!player) return <div key={rankIdx} className="w-32" />;

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rankIdx * 0.2, type: "spring", stiffness: 120 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Medal + name */}
            <div className="text-3xl">{MEDALS[rankIdx]}</div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: `hsl(${(player.username?.charCodeAt(0) || 65) * 5}, 65%, 38%)` }}
            >
              {player.username?.[0]?.toUpperCase()}
            </div>
            <p className="text-sm font-bold text-white max-w-[90px] text-center truncate">{player.username}</p>
            <p className="text-xs font-semibold text-brand-400">{player.score?.toLocaleString()} pts</p>

            {/* Podium block */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: rankIdx * 0.2 + 0.3, duration: 0.4 }}
              style={{ transformOrigin: "bottom" }}
              className={`w-28 ${HEIGHTS[rankIdx]} rounded-t-xl flex items-center justify-center ${
                rankIdx === 0 ? "bg-gradient-to-b from-amber-400 to-amber-600" :
                rankIdx === 1 ? "bg-gradient-to-b from-slate-300 to-slate-500" :
                "bg-gradient-to-b from-amber-700 to-amber-900"
              }`}
            >
              <span className="text-white font-black text-3xl opacity-30">#{rankIdx + 1}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
