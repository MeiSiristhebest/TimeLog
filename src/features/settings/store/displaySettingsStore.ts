import { create } from 'zustand';
import {
  getDisplaySettings,
  resetDisplaySettings,
  setFontScaleIndex,
  setThemeMode,
  type ThemeMode,
} from '../services/displaySettingsService';

type DisplaySettingsState = {
  themeMode: ThemeMode;
  fontScaleIndex: number;
  isLoaded: boolean;
  hydrate: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScaleIndex: (index: number) => void;
  reset: () => void;
};

export const useDisplaySettingsStore = create<DisplaySettingsState>((set) => ({
  themeMode: 'system',
  fontScaleIndex: 2,
  isLoaded: false,
  hydrate: () => {
    const settings = getDisplaySettings();
    set({ ...settings, isLoaded: true });
  },
  setThemeMode: (mode) => {
    setThemeMode(mode);
    set({ themeMode: mode });
  },
  setFontScaleIndex: (index) => {
    setFontScaleIndex(index);
    set({ fontScaleIndex: index });
  },
  reset: () => {
    resetDisplaySettings();
    set({ themeMode: 'system', fontScaleIndex: 2 });
  },
}));
