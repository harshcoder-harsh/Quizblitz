import { motion } from "framer-motion";
import CategoryBadge from "./CategoryBadge";

export default function QuestionCard({ question, questionNumber, totalQuestions }) {
  if (!question) return null;

  const diffClass = {
    EASY:   "badge-easy",
    MEDIUM: "badge-medium",
    HARD:   "badge-hard",
  }[question.difficulty] || "badge-medium";

  const diffLabel = { EASY: "🟢 Easy", MEDIUM: "🟡 Medium", HARD: "🔴 Hard" }[question.difficulty];
  const typeLabel = question.type === "CODE_OUTPUT"
    ? "💻 Code Output"
    : question.type === "TRUE_FALSE"
    ? "✅ True / False"
    : "📝 Multiple Choice";

  return (
    <motion.div
      key={questionNumber}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 md:p-8"
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm font-medium">
            Question {questionNumber} / {totalQuestions}
          </span>
          {question.category && (
            <CategoryBadge icon={question.category.icon} name={question.category.name} color={question.category.color} />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={diffClass}>{diffLabel}</span>
          <span className="badge bg-surface-700 text-gray-400">{typeLabel}</span>
        </div>
      </div>

      {/* Question text */}
      <p className="text-white text-xl md:text-2xl font-semibold leading-snug">
        {question.questionText}
      </p>
    </motion.div>
  );
}
