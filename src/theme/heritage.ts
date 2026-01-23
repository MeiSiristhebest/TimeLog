/**
 * Heritage Memoir - Central Design System
 * 
 * "Instagram" quality requires consistency. 
 * This file acts as the single source of truth for all "premium" interactions.
 */

import { useColorScheme } from 'nativewind';
import { useMemo } from 'react';
import { Easing } from 'react-native-reanimated';

// ------------------------------------------------------------------
// 1. TOKENS - The Visual Language
// ------------------------------------------------------------------

export const PALETTE = {
    // Brand - Terracotta System (from HTML mockup)
    primary: '#D97757',
    primaryDeep: '#C26B4A',
    primarySoft: '#FDF2EE',
    primaryMuted: '#EABFAA',

    // Backgrounds - from HTML mockup
    surface: '#FFFAF5',        // background-cream
    surfaceDim: '#f8f7f6',     // background-light
    surfaceAccent: '#FDF2EE',  // terracotta-soft
    surfaceDark: '#1e1714',
    surfaceWarm: '#FFFAF5',
    surfaceCard: '#FFFFFF',

    // Text - from HTML charcoal system
    onPrimary: '#FFFFFF',
    onSurface: '#2C221F',      // charcoal
    textMuted: '#81706a',
    textFaint: '#5c5552',

    // States
    error: '#B84A4A',
    success: '#7D9D7A',        // sage-green
    warning: '#F59E0B',        // amber-custom
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
    // Button Presses - Snappy but noticeable
    press: {
        damping: 15,
        stiffness: 400,
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

// ------------------------------------------------------------------
// 3. HOOKS - Usage
// ------------------------------------------------------------------

type HeritageTheme = {
    colors: typeof PALETTE;
    spacing: typeof SPACING;
    radius: typeof RADIUS;
    animation: typeof ANIMATION_CONFIGS;
    isDark: boolean;
};

export function useHeritageTheme(): HeritageTheme {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    return useMemo(() => ({
        colors: PALETTE, // TODO: Add Dark Mode Palette Mapping here if we want "Dark" Heritage
        spacing: SPACING,
        radius: RADIUS,
        animation: ANIMATION_CONFIGS,
        isDark,
    }), [isDark]);
}
