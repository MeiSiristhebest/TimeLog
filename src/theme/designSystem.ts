/**
 * TimeLog Design System
 * 
 * Aesthetic: "Digital Heritage"
 * Core Values: Warmth, Clarity, Permanence
 * 
 * Color Logic:
 * - Surfaces: Different shades of warm white/cream, simulating paper/memories
 * - Primary: Heritage Terracotta (Earth tone)
 * - Accents: Sage Green (Growth), Soft Gold (Precious)
 * - Typography: High contrast, large serif/sans-serif pairing
 */

export const PALETTE = {
  // Backgrounds - Use Linear Gradients for depth
  background: {
    light: '#FFFAF5', // Warm White
    warm: '#FFF5EB',  // Creamier
    dark: '#2C221F',  // Warm Dark (Espresso)
  },
  
  // Primary Brand Colors
  primary: {
    main: '#C26B4A', // Heritage Terracotta
    light: '#E59C7F',
    dark: '#8A4228',
    contrastText: '#FFFFFF',
  },

  // Secondary Accents
  secondary: {
    main: '#7D9D7A', // Sage Green (Comfort/Safety)
    light: '#A3C4A0',
    dark: '#4F6C4D',
  },

  // Neutrals suitable for text
  text: {
    primary: '#2C221F',   // Soft Black (Espresso)
    secondary: '#8C7A6C', // Muted Brown
    tertiary: '#C4B5AA',  // Stone
    disabled: '#E6E0DA',
  },

  // Semantic
  status: {
    success: '#7D9D7A',
    error: '#C65D4A',
    warning: '#E8B668',
    info: '#7AA3CC',
  },

  // Surfaces & Borders
  surface: {
    card: '#FFFFFF',
    overlay: 'rgba(255, 255, 255, 0.85)',
    border: 'rgba(194, 107, 74, 0.15)', // Subtle primary tint
  }
};

export const GRADIENTS = {
  // Main background: Subtle warm flow
  background: ['#FFFAF5', '#FFF0E0'],
  
  // Primary Action: Vibrant but earthy
  primaryAction: ['#C26B4A', '#D98263'],
  
  // Cards: Subtle pearlescent
  glassCard: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32, // For heavy cards
  full: 9999,
};

export const SHADOWS = {
  // Soft, diffuse light (Daylight)
  soft: {
    shadowColor: '#C26B4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  // Deep shadow for floating elements
  floating: {
    shadowColor: '#2C221F',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};
