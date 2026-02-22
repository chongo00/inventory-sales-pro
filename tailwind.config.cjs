module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        }
      },
      animation: {
        fadeIn: "fadeIn 0.35s ease-out",
        slideUp: "slideUp 0.35s ease-out",
        scaleIn: "scaleIn 0.25s ease-out"
      },
      transitionDuration: {
        200: "200ms",
        300: "300ms"
      }
    }
  },
  plugins: []
};
