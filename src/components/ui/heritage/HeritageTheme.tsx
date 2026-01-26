/**
 * HeritageTheme - Theme provider with dark mode support.
 *
 * Features:
 * - Light and dark mode tokens
 * - System preference detection
 * - Manual toggle support
 * - Persistent preference storage
 * - Heritage Memoir color palette for both modes
 *
 * @example
 * // In root layout
 * <HeritageThemeProvider>
 *   <App />
 * </HeritageThemeProvider>
 *
 * // In any component
 * const { theme, isDark, toggleTheme } = useHeritageTheme();
 * <View style={{ backgroundColor: theme.surface }}>
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useHeritageThemeLogic } from './hooks/useHeritageThemeLogic';

// Light Mode Tokens (Heritage Memoir)
const lightTheme = {
  // Backgrounds
  background: '#F9F3E8', // Aged parchment
  surface: '#FFFCF7', // Elevated cards
  surfaceSecondary: '#F5EFE6', // Secondary surface

  // Primary colors
  primary: '#B85A3B', // Deep Terracotta
  primaryLight: '#C9A961', // Warm gold accent

  // Text
  onSurface: '#1E293B', // High contrast
  textMuted: '#475569', // Secondary text
  textDisabled: '#94A3B8', // Disabled text

  // Semantic
  success: '#6B8E6B', // Sage green
  warning: '#C49832', // Amber
  error: '#B84A4A', // Muted red
  info: '#5B8AC4', // Calm blue

  // Borders & shadows
  border: '#E2E8F0',
  borderFocus: '#B85A3B',
  shadow: 'rgba(184, 90, 59, 0.15)',
  backdrop: 'rgba(30, 41, 59, 0.4)',

  // Skeleton
  skeleton: '#E8E0D5',
  skeletonHighlight: '#F5EFE6',
} as const;

// Dark Mode Tokens (Heritage Memoir Night)
const darkTheme = {
  // Backgrounds
  background: '#1A1612', // Deep warm black
  surface: '#2A2420', // Elevated cards
  surfaceSecondary: '#352E28', // Secondary surface

  // Primary colors
  primary: '#D4856A', // Lighter terracotta
  primaryLight: '#DAC17A', // Warm gold accent

  // Text
  onSurface: '#F5EFE6', // Off-white
  textMuted: '#A89F96', // Secondary text
  textDisabled: '#6B635C', // Disabled text

  // Semantic
  success: '#8FB88F', // Lighter sage
  warning: '#E0B64E', // Brighter amber
  error: '#D47070', // Lighter red
  info: '#7AA3D6', // Lighter blue

  // Borders & shadows
  border: '#3D3530',
  borderFocus: '#D4856A',
  shadow: 'rgba(0, 0, 0, 0.4)',
  backdrop: 'rgba(0, 0, 0, 0.6)',

  // Skeleton
  skeleton: '#3D3530',
  skeletonHighlight: '#4A423C',
} as const;

// Common theme interface
export interface HeritageTheme {
  // Backgrounds
  background: string;
  surface: string;
  surfaceSecondary: string;

  // Primary colors
  primary: string;
  primaryLight: string;

  // Text
  onSurface: string;
  textMuted: string;
  textDisabled: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // Borders & shadows
  border: string;
  borderFocus: string;
  shadow: string;
  backdrop: string;

  // Skeleton
  skeleton: string;
  skeletonHighlight: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: HeritageTheme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

type HeritageThemeProviderProps = {
  children: ReactNode;
  defaultMode?: ThemeMode;
};

export function HeritageThemeProvider({
  children,
  defaultMode = 'system',
}: HeritageThemeProviderProps) {
  const { theme, isDark, mode, setMode, toggleTheme, isLoaded } =
    useHeritageThemeLogic(defaultMode);

  // Don't render until preference is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, mode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useHeritageTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return light theme as default if provider not found
    return {
      theme: lightTheme,
      isDark: false,
      mode: 'light',
      setMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

// Export themes for direct access if needed
export { lightTheme, darkTheme };

// Re-export convenience hook
export const useTheme = useHeritageTheme;

export default HeritageThemeProvider;
