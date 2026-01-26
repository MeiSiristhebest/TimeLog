import { useState, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeMode, lightTheme, darkTheme, HeritageTheme } from '../HeritageTheme';
import { devLog } from '@/lib/devLogger';
import { mmkv } from '@/lib/mmkv';

const THEME_STORAGE_KEY = '@heritage_theme_preference';

type HeritageThemeLogic = {
  theme: HeritageTheme;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (newMode: ThemeMode) => Promise<void>;
  toggleTheme: () => void;
  isLoaded: boolean;
};

export function useHeritageThemeLogic(defaultMode: ThemeMode = 'system'): HeritageThemeLogic {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preference
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const savedMode = mmkv.getString(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        devLog.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreference();
  }, []);

  // Save preference
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      mmkv.set(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      devLog.warn('Failed to save theme preference:', error);
    }
  }, []);

  // Toggle
  const toggleTheme = useCallback(() => {
    setMode(
      mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark') ? 'light' : 'dark'
    );
  }, [mode, systemColorScheme, setMode]);

  // Derived state
  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    isDark,
    mode,
    setMode,
    toggleTheme,
    isLoaded,
  };
}
