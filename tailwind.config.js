/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0c0c0b',
        card: '#161614',
        border: '#282826',
        muted: '#6b6960',
        accent: '#e8f55a',
        teal: '#5af5e8',
        orange: '#f5a85a',
        purple: '#b05af5',
        green: '#c8f55a',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
