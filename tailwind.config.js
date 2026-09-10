/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#050914",
          900: "#0A1128",
          800: "#0F1B3C",
          700: "#152552",
        },
        signal: {
          400: "#3FE0D0",
          500: "#17C9C0",
          600: "#0EA5A0",
        },
        pulse: {
          400: "#FF7A66",
          500: "#FF5D45",
        },
        amber: {
          300: "#FFD166",
          400: "#FFC233",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(63, 224, 208, 0.25)",
        glowPulse: "0 0 40px rgba(255, 93, 69, 0.3)",
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(63,224,208,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(63,224,208,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "bar-bounce": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        "float-up": {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "bar-bounce": "bar-bounce 0.9s ease-in-out infinite",
        "float-up": "float-up 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
