/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#C26B4A',
        onPrimary: '#FFF8E7',
        surface: '#FFFAF5',
        onSurface: '#2C2C2C',
        success: '#7D9D7A',
        warning: '#D4A012',
        error: '#C65D4A',
      },
      fontFamily: {
        sans: ['System'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '40px' }],
        headline: ['28px', { lineHeight: '36px' }],
        body: ['24px', { lineHeight: '32px' }],
        caption: ['18px', { lineHeight: '24px' }],
      },
    },
  },
  plugins: [],
};
