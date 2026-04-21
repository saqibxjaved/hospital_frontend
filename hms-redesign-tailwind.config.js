/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy — primary brand
        navy: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          400: "#818cf8",
          500: "#3730a3",
          600: "#2d2783",
          700: "#1e1b6b",
          800: "#14124f",
          900: "#0c0a36",
        },
        // Warm neutral surfaces
        sand: {
          50:  "#fafaf9",
          100: "#f5f5f0",
          200: "#eeede6",
          300: "#e3e1d7",
        },
        // Status
        emerald: { 500: "#10b981", 600: "#059669" },
        rose:    { 500: "#f43f5e", 600: "#e11d48" },
        amber:   { 500: "#f59e0b", 600: "#d97706" },
        sky:     { 500: "#0ea5e9", 600: "#0284c7" },
      },
      fontFamily: {
        sans:    ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
        display: ["'Fraunces'", "ui-serif", "Georgia"],
        mono:    ["'Fira Code'", "monospace"],
      },
      boxShadow: {
        "card":    "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
        "card-md": "0 4px 6px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.08)",
        "card-lg": "0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.10)",
        "navy":    "0 4px 20px rgba(55,48,163,0.25)",
      },
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
