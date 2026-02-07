import { mmkv } from '@/lib/mmkv';
import { FONT_SCALE_LABELS, DEFAULT_FONT_SCALE_INDEX } from '@/theme/fontScale';

export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_KEY = 'display.themeMode';
const SCALE_KEY = 'display.fontScaleIndex';
const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

export const DEFAULT_THEME_MODE: ThemeMode = 'system';
const MAX_FONT_SCALE_INDEX = FONT_SCALE_LABELS.length - 1;

function clampScaleIndex(index: number): number {
  if (!Number.isFinite(index)) return DEFAULT_FONT_SCALE_INDEX;
  return Math.max(0, Math.min(MAX_FONT_SCALE_INDEX, Math.round(index)));
}

export function getDisplaySettings(): { themeMode: ThemeMode; fontScaleIndex: number } {
  const storedMode = mmkv.getString(THEME_KEY);
  const themeMode = THEME_MODES.includes(storedMode as ThemeMode)
    ? (storedMode as ThemeMode)
    : DEFAULT_THEME_MODE;

  const scaleRaw = mmkv.getString(SCALE_KEY);
  const parsedScale = scaleRaw ? Number(scaleRaw) : Number.NaN;
  const fontScaleIndex = clampScaleIndex(parsedScale);

  return { themeMode, fontScaleIndex };
}

export function setThemeMode(mode: ThemeMode): void {
  mmkv.set(THEME_KEY, mode);
}

export function setFontScaleIndex(index: number): void {
  mmkv.set(SCALE_KEY, String(clampScaleIndex(index)));
}

export function resetDisplaySettings(): void {
  setThemeMode(DEFAULT_THEME_MODE);
  setFontScaleIndex(DEFAULT_FONT_SCALE_INDEX);
}
