/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryFrom: "#6a11cb", // violet-purple gradient start
        primaryTo: "#2575fc",   // blue gradient end
      },
    },
  },
  plugins: [],
};
