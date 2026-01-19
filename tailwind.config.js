/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        unico: {
          50: "#fff1f1",
          100: "#ffdfdf",
          600: "#E10600",
          700: "#c50500",
          900: "#0f0f10"
        },
        score: {
          red: "#E10600",
          blue: "#003087"
        }
      }
    }
  },
  plugins: []
};