/**
 * Heritage Memoir - Central Design System
 *
 * "Instagram" quality requires consistency.
 * This file acts as the single source of truth for all "premium" interactions.
 */

import { useColorScheme } from 'nativewind';
import { useEffect, useMemo } from 'react';
import { Easing } from 'react-native-reanimated';
import { useDisplaySettingsStore } from '@/features/settings/store/displaySettingsStore';
import { DEFAULT_FONT_SCALE_INDEX, FONT_SCALE_STEPS } from './fontScale';

export { DEFAULT_FONT_SCALE_INDEX, FONT_SCALE_LABELS, FONT_SCALE_STEPS } from './fontScale';

// ------------------------------------------------------------------
// 1. TOKENS - The Visual Language
// ------------------------------------------------------------------

export const PALETTE = {
  // Brand - Terracotta System (from HTML mockup)
  primary: '#D97757',
  primaryDeep: '#C26B4A',
  primarySoft: '#FDF2EE',
  primaryMuted: '#EABFAA',
  tertiary: '#6B8C9E', // blueAccent mapped as tertiary

  // Backgrounds - from HTML mockup
  surface: '#FFFAF5', // background-cream
  surfaceDim: '#f8f7f6', // background-light
  surfaceAccent: '#FDF2EE', // terracotta-soft
  surfaceDark: '#1e1714',
  surfaceWarm: '#FFFAF5',
  surfaceCard: '#FFFFFF',

  // Text - from HTML charcoal system
  onPrimary: '#FFFFFF',
  onSurface: '#2C221F', // charcoal
  textMuted: '#81706a',
  textFaint: '#5c5552',

  // States
  error: '#B84A4A',
  success: '#7D9D7A', // sage-green
  warning: '#F59E0B', // amber-custom
  disabled: '#CBD5E1',
  disabledText: '#94A3B8',

  // Accents
  border: '#E5E0DC',
  borderLight: '#f0ebe9',
  handle: '#CBD5E1',
  handleActive: '#D97757',
  shadow: '#D97757',
  shadowNeutral: '#000000',
  backdrop: 'rgba(30, 41, 59, 0.4)',

  // Category Colors (from HTML mockup)
  sageGreen: '#7D9D7A',
  amberCustom: '#F59E0B',
  blueAccent: '#6B8C9E',

  // Overlays
  overlayLight: 'rgba(22, 20, 18, 0.05)',
  overlayMedium: 'rgba(22, 20, 18, 0.1)',
  overlayDark: 'rgba(22, 20, 18, 0.15)',

  // Functional & UI Specific
  amberDeep: '#D4A012', // Notification accents
  iconBlue: '#60A5FA',
  iconOrange: '#FB923C',
  iconRed: '#EF4444',
  surfaceCream: '#FFFDF5', // Specific light cream for notifications
} as const;

// Dark Mode Palette - Mapped from Heritage Memoir Night
export const DARK_PALETTE = {
  // Brand
  primary: '#D4856A',
  primaryDeep: '#A65D45',
  primarySoft: '#352E28',
  primaryMuted: '#8A5A4A',
  tertiary: '#7AA3D6', // blueAccent mapped as tertiary

  // Backgrounds
  surface: '#1A1612', // background-dark
  surfaceDim: '#14110E', // background-darker
  surfaceAccent: '#2A2420', // surface-elevated
  surfaceDark: '#000000',
  surfaceWarm: '#1A1612',
  surfaceCard: '#2A2420',

  // Text
  onPrimary: '#1A1612',
  onSurface: '#F5EFE6', // off-white
  textMuted: '#A89F96',
  textFaint: '#6B635C',

  // States
  error: '#D47070',
  success: '#8FB88F',
  warning: '#E0B64E',
  disabled: '#3D3530',
  disabledText: '#6B635C',

  // Accents
  border: '#3D3530',
  borderLight: '#4A423C',
  handle: '#6B635C',
  handleActive: '#D4856A',
  shadow: '#000000',
  shadowNeutral: '#000000',
  backdrop: 'rgba(0, 0, 0, 0.6)',

  // Category Colors
  sageGreen: '#8FB88F',
  amberCustom: '#E0B64E',
  blueAccent: '#7AA3D6',

  // Overlays
  overlayLight: 'rgba(255, 255, 255, 0.05)',
  overlayMedium: 'rgba(255, 255, 255, 0.1)',
  overlayDark: 'rgba(255, 255, 255, 0.15)',

  // Functional & UI Specific
  amberDeep: '#E0B64E', // Mapped to warning in dark mode
  iconBlue: '#60A5FA',
  iconOrange: '#FB923C',
  iconRed: '#EF4444',
  surfaceCream: '#1A1612', // Map to surfaceWarm in dark
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

// ------------------------------------------------------------------
// 2. ANIMATION - The "Physics" of Quality
// ------------------------------------------------------------------

/**
 * Premium Spring Config
 * Heavy mass (1) + High Stiffness (300-400) = "Solid" but "Responsive" feel.
 * No wobbly retention.
 */
export const ANIMATION_CONFIGS = {
  // Button Presses - "Heavy Book" Feel
  // High damping + Low stiffness = Stable, solid, no jitter
  press: {
    damping: 30, // Increased from 15
    stiffness: 250, // Decreased from 400
    mass: 1,
  },

  // Screen Transitions / Modals - Smooth & Flowing
  modal: {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
  },

  // Checkboxes / Toggles - Bouncy
  control: {
    damping: 12,
    stiffness: 200,
  },

  // Layout Transitions
  layout: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
} as const;

export const ANIMATION_DURATIONS = {
  // Global Navigation
  SCREEN_TRANSITION: 400, // iOS style, slower

  // Core Interaction
  CARD_FLIP_OUT: 200, // Faster exit
  CARD_FLIP_IN: 500, // "Flowing" enter (Discovery)

  // Tab Bar
  TAB_INDICATOR: 300,
} as const;

// ------------------------------------------------------------------
// 3. HOOKS - Usage
// ------------------------------------------------------------------

type HeritageTheme = {
  colors: typeof PALETTE | typeof DARK_PALETTE;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  animation: typeof ANIMATION_CONFIGS;
  animationDurations: typeof ANIMATION_DURATIONS;
  typography: HeritageTypography;
  fontScaleIndex: number;
  isDark: boolean;
};

export type HeritageTypography = {
  body: number;
  title: number;
  subtitle: number;
  caption: number;
  label: number;
};

export function createTypography(scale: number): HeritageTypography {
  return {
    body: Math.round(24 * scale),
    title: Math.round(28 * scale),
    subtitle: Math.round(26 * scale),
    caption: Math.round(20 * scale),
    label: Math.round(22 * scale),
  };
}

export function createHeritageTheme({
  themeMode,
  fontScaleIndex,
  systemScheme,
}: {
  themeMode: 'system' | 'light' | 'dark';
  fontScaleIndex: number;
  systemScheme: 'light' | 'dark' | null | undefined;
}): HeritageTheme {
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const scale = FONT_SCALE_STEPS[fontScaleIndex] ?? FONT_SCALE_STEPS[DEFAULT_FONT_SCALE_INDEX];

  return {
    colors: isDark ? DARK_PALETTE : PALETTE,
    spacing: SPACING,
    radius: RADIUS,
    animation: ANIMATION_CONFIGS,
    animationDurations: ANIMATION_DURATIONS,
    typography: createTypography(scale),
    fontScaleIndex,
    isDark,
  };
}

export function useHeritageTheme(): HeritageTheme {
  const { colorScheme } = useColorScheme();
  const { themeMode, fontScaleIndex, isLoaded, hydrate } = useDisplaySettingsStore();

  useEffect(() => {
    if (!isLoaded) {
      hydrate();
    }
  }, [hydrate, isLoaded]);

  return useMemo(
    () =>
      createHeritageTheme({
        themeMode,
        fontScaleIndex,
        systemScheme: colorScheme,
      }),
    [themeMode, fontScaleIndex, colorScheme]
  );
}
