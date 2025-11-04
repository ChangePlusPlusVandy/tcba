/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": "#194B90",
          "secondary": "#88242C",
          "accent": "#346FC0",
          "neutral": "#717171",
          "base-100": "#ffffff",
          "base-200": "#F1F1F1",
          "base-300": "#D9D9D9",
          "base-content": "#3C3C3C",
          "info": "#346FC0",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#D54242",
        },
      },
    ],
    darkTheme: false,
    base: true,
    styled: true,
    utils: true,
    logs: false,
  },
};
