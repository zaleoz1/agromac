/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        'cor-primaria': '#15637b',
        'cor-secundaria': '#10546b',
        'cor-terciaria': '#0b445b',
        'cor-quaternaria': '#05354a',
        'cor-escura': '#00253a',
        'cor-no': '#E7EFF2',
        'cor-no-escuro': '#E7EFF8',
      },
      blue: {
        500: '#15637b',
        600: '#10546b',
        700: '#0b445b',
      }
    },
  },
  plugins: [],
}

