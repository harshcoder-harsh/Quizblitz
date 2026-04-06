import { motion } from "framer-motion";

export default function Explanation({ text, referenceUrl }) {
  if (!text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 border-l-4 border-brand-500"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div>
          <h4 className="text-brand-400 font-semibold text-sm mb-1 uppercase tracking-wide">Explanation</h4>
          <p className="text-gray-200 text-sm leading-relaxed">{text}</p>
          {referenceUrl && (
            <a
              href={referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-brand-400 hover:text-brand-300 underline"
            >
              📖 Read more →
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
