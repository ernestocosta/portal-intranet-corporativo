/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4fb",
          100: "#d5e3f5",
          200: "#adc7eb",
          300: "#7da6dd",
          400: "#5588ce",
          500: "#1b5a9e",
          600: "#164b85",
          700: "#123c6b",
          800: "#0e2d52",
          900: "#0a1f3a",
        },
        accent: {
          50: "#edfcf5",
          100: "#d3f8e5",
          200: "#a8f0cd",
          300: "#6ee2aa",
          400: "#35cc83",
          500: "#10b068",
          600: "#069054",
          700: "#047346",
          800: "#065b39",
          900: "#054b31",
        },
        hbp: {
          blue: { 50: "#eef4fb", 100: "#d9e8f7", 500: "#026873", 600: "#025965", 700: "#024b56", 800: "#033d47", 900: "#032f38" },
          green: { 50: "#eff9ed", 100: "#dcf2d7", 500: "#3AA637", 600: "#2f8e2e", 700: "#287428", 800: "#225d22", 900: "#1d4c1d" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
