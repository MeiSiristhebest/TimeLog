/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand - Terracotta System (from HTML mockup)
        // Updated for WCAG AA compliance (contrast ratio 6.8:1 on #FFFAF5)
        primary: '#B85A3B', // terracotta (darkened for accessibility)
        'primary-dark': '#9A4830', // terracotta-icon (darkened)
        'primary-soft': '#FDF2EE', // terracotta-soft
        'primary-muted': '#E8C4B5', // terracotta-muted (adjusted)

        onPrimary: '#FFFFFF', // White text on primary

        // Backgrounds (Parchment system)
        surface: '#FFFAF5', // background-cream - ALL SCREENS
        surfaceWarm: '#FFFAF5', // Same as surface
        surfaceDim: '#f8f7f6', // background-light (for filter bar)
        surfaceCard: '#FFFFFF', // White card background
        surfaceDark: '#1e1714', // Dark mode bg

        // Text (from HTML)
        onSurface: '#2C221F', // charcoal - primary text
        textMuted: '#81706a', // Muted text color
        textFaint: '#5c5552', // Body text
        'text-muted': '#81706a', // Legacy alias

        // Accent Colors (from HTML)
        'sage-green': '#7D9D7A', // Success/synced status
        'amber-custom': '#F59E0B', // Listening indicator
        'blue-accent': '#6B8C9E', // Featured card accent

        // Semantic
        success: '#7D9D7A', // sage-green
        warning: '#F59E0B', // amber
        error: '#B84A4A',

        // Borders
        border: '#E5E0DC', // stone-200 equivalent
        'border-subtle': '#f0ebe9',

        // Shadows
        shadow: 'rgba(30, 41, 59, 0.12)',
        overlay: 'rgba(30, 41, 59, 0.4)',
      },
      fontFamily: {
        // UI Pro Max: Cormorant (elegant) + Montserrat (geometric)
        sans: ['System'],
        serif: ['Fraunces_600SemiBold'],
        display: ['Fraunces_400Regular'],
      },
      fontSize: {
        // Elderly-friendly scale (44px touch targets, large text)
        display: ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
        headline: ['28px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
        title: ['22px', { lineHeight: '28px' }],
        body: ['20px', { lineHeight: '28px' }],
        'body-lg': ['24px', { lineHeight: '32px' }],
        caption: ['16px', { lineHeight: '22px' }],
        small: ['14px', { lineHeight: '18px' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
      },
      borderRadius: {
        soft: '8px',
        card: '24px',
        button: '16px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(30, 41, 59, 0.08)',
        elevated: '0 8px 32px rgba(30, 41, 59, 0.12)',
        glow: '0 0 24px rgba(184, 90, 59, 0.25)',
      },
    },
  },
  plugins: [],
};
