/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0b10",
          900: "#0f1117",
          800: "#161923",
          700: "#1f2230",
          600: "#2a2e40",
          500: "#3a3f54",
          400: "#6b7189",
          300: "#a0a5b8",
          100: "#d7dae3",
        },
        accent: {
          DEFAULT: "#e8ff4a",  // signal yellow
          dim: "#c5d72f",
        },
        signal: {
          red: "#ff4d5e",
          amber: "#ffb547",
          green: "#2bd07c",
          blue: "#4aa7ff",
          violet: "#a98bff",
        },
      },
      fontFamily: {
        display: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        body: ['"Inter"', "ui-sans-serif", "system-ui"],
        serif: ['"Fraunces"', "ui-serif", "Georgia"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
    },
  },
  plugins: [],
};
