import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../store/authStore";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function AnswerOptions({ options = [], onSelect, selectedId, answerResult, answerReveal, disabled }) {
  const userId = useAuthStore((s) => s.user?.id);
  const correctId = answerReveal?.correctOptionId ?? answerResult?.correctOptionId;

  function getOptionState(option) {
    if (correctId) {
      if (option.id === correctId) return "correct";
      if (option.id === selectedId && option.id !== correctId) return "wrong";
      return "neutral";
    }
    if (selectedId === option.id) return "selected";
    return "default";
  }

  const stateClasses = {
    default:  "bg-surface-700 border-surface-500 hover:border-brand-400 hover:bg-surface-600 cursor-pointer",
    selected: "bg-brand-500/20 border-brand-500 shadow-glow-brand cursor-default",
    correct:  "bg-emerald-500/20 border-emerald-500 shadow-glow-green cursor-default",
    wrong:    "bg-red-500/20 border-red-500 shadow-glow-red cursor-default",
    neutral:  "bg-surface-800 border-surface-600 opacity-50 cursor-default",
  };

  const stateIcons = { correct: "✓", wrong: "✗", selected: "→", default: "", neutral: "" };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <AnimatePresence mode="wait">
        {options.map((option, i) => {
          const state = getOptionState(option);
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => !disabled && !selectedId && onSelect(option.id)}
              className={`relative flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${stateClasses[state]}`}
            >
              {/* Option letter */}
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-600 flex items-center justify-center text-sm font-bold text-gray-300">
                {stateIcons[state] || OPTION_LABELS[i]}
              </span>
              <span className="text-sm md:text-base font-medium text-white leading-snug">
                {option.optionText}
              </span>
              {state === "correct" && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute right-3 top-3 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
