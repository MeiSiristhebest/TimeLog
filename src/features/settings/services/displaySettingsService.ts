import { mmkv } from '@/lib/mmkv';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'display.themeMode';
const SCALE_KEY = 'display.fontScaleIndex';
const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

export const DEFAULT_THEME_MODE: ThemeMode = 'system';
export const DEFAULT_FONT_SCALE_INDEX = 2;

export function getDisplaySettings(): { themeMode: ThemeMode; fontScaleIndex: number } {
  const storedMode = mmkv.getString(THEME_KEY);
  const themeMode = THEME_MODES.includes(storedMode as ThemeMode)
    ? (storedMode as ThemeMode)
    : DEFAULT_THEME_MODE;

  const scaleRaw = mmkv.getString(SCALE_KEY);
  const parsedScale = scaleRaw ? Number(scaleRaw) : Number.NaN;
  const fontScaleIndex = Number.isFinite(parsedScale) ? parsedScale : DEFAULT_FONT_SCALE_INDEX;

  return { themeMode, fontScaleIndex };
}

export function setThemeMode(mode: ThemeMode): void {
  mmkv.set(THEME_KEY, mode);
}

export function setFontScaleIndex(index: number): void {
  mmkv.set(SCALE_KEY, String(index));
}

export function resetDisplaySettings(): void {
  setThemeMode(DEFAULT_THEME_MODE);
  setFontScaleIndex(DEFAULT_FONT_SCALE_INDEX);
}
