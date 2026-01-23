/**
 * Heritage Memoir Palette - Shared color constants for TimeLog.
 *
 * These colors match the NativeWind tailwind.config.js theme colors
 * but are available for direct usage in StyleSheet or Reanimated components.
 *
 * Per AGENTS.md: Use NativeWind className exclusively except for react-native-reanimated.
 */

export const HERITAGE_COLORS = {
  // Primary palette
  primary: '#B85A3B', // Deep Terracotta
  onPrimary: '#FFF8E7',

  // Surface colors
  surface: '#F9F3E8', // Aged Parchment
  surfaceElevated: '#FFFCF7', // Elevated Parchment
  onSurface: '#1E293B', // High contrast text

  // Secondary
  secondary: '#8B7355',
  onSecondary: '#FFFFFF',

  // Semantic colors
  success: '#6B8E6B', // Sage green
  warning: '#C49832', // Warm amber
  error: '#B84A4A', // Warm red

  // Neutral shades
  neutral100: '#F9F3E8',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E1',
  neutral500: '#475569',

  // Accent
  accent: '#C9A961', // Soft gold

  // Shadows (tinted)
  shadow: '#B85A3B',
} as const;

export type HeritageColor = keyof typeof HERITAGE_COLORS;

export default HERITAGE_COLORS;
