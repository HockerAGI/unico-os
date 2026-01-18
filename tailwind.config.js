/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        unico: {
          50: "#fff1f1",
          100: "#ffdfdf",
          600: "#E10600",
          900: "#1a1a1a",
        },
        score: {
          blue: "#003366",
        },
      },
    },
  },
  plugins: [],
};