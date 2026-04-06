import { motion } from "framer-motion";

export default function Timer({ timeLeft, duration, isRunning }) {
  const progress = duration > 0 ? timeLeft / duration : 0;

  const color = progress > 0.5
    ? "#10b981"
    : progress > 0.25
    ? "#f59e0b"
    : "#ef4444";

  const circumference = 2 * Math.PI * 44; // r=44
  const strokeDash = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="#22223a" strokeWidth="8" />
          {/* Progress ring */}
          <motion.circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            transition={{ duration: 1, ease: "linear" }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        {/* Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={timeLeft}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-2xl font-bold tabular-nums"
            style={{ color }}
          >
            {timeLeft}
          </motion.span>
        </div>
      </div>
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
        {isRunning ? "seconds left" : "time's up!"}
      </span>
    </div>
  );
}
