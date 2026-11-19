/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#145C3B',      // verde escuro
          primary: '#198754',   // verde principal
          light: '#E8F5ED',     // verde claro
          orange: '#F28C28',    // laranja
          grayLight: '#F4F6F5', // cinza claro
          grayDark: '#26332D',  // cinza escuro
        }
      }
    },
  },
  plugins: [],
}
