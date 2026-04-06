/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          200: "#c7d7fe",
          300: "#a5b8fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          900: "#0a0a0f",
          800: "#111118",
          700: "#1a1a28",
          600: "#22223a",
          500: "#2d2d4a",
        },
      },
      animation: {
        "pulse-fast": "pulse 0.8s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.36,0.07,0.19,0.97)",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        slideUp: { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        bounceIn: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.05)" } },
        glow: { from: { boxShadow: "0 0 10px #6366f1" }, to: { boxShadow: "0 0 25px #6366f1, 0 0 40px #4338ca" } },
      },
      boxShadow: {
        "glow-brand": "0 0 20px rgba(99,102,241,0.4)",
        "glow-green": "0 0 20px rgba(16,185,129,0.4)",
        "glow-red":   "0 0 20px rgba(239,68,68,0.4)",
        "card": "0 4px 24px rgba(0,0,0,0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-pattern": "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};
