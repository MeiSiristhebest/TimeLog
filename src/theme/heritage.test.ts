import { createHeritageTheme, DEFAULT_FONT_SCALE_INDEX, FONT_SCALE_LABELS } from './heritage';

const systemScheme = 'light';

describe('heritage theme helpers', () => {
  it('returns dark palette for dark mode', () => {
    const theme = createHeritageTheme({
      themeMode: 'dark',
      fontScaleIndex: DEFAULT_FONT_SCALE_INDEX,
      systemScheme,
    });
    expect(theme.isDark).toBe(true);
  });

  it('typography scales by step', () => {
    const theme = createHeritageTheme({
      themeMode: 'light',
      fontScaleIndex: 4,
      systemScheme,
    });
    expect(theme.typography.body).toBeGreaterThan(24);
  });

  it('labels length matches steps', () => {
    expect(FONT_SCALE_LABELS.length).toBe(7);
  });
});
