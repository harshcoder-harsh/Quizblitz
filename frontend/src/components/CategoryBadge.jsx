export default function CategoryBadge({ icon, name, color, size = "sm" }) {
  const paddingClass = size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold ${paddingClass} border`}
      style={{ color, borderColor: `${color}40`, backgroundColor: `${color}18` }}
    >
      <span>{icon}</span>
      <span>{name}</span>
    </span>
  );
}
