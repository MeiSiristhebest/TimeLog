export type LanguageOption = {
  code: string;
  label: string;
};

export function getSystemLocale(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale || 'en';
  } catch {
    return 'en';
  }
}

function getDisplayNames(locale: string): Intl.DisplayNames | null {
  try {
    if (typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
      return new Intl.DisplayNames([locale], { type: 'language' });
    }
  } catch {
    return null;
  }
  return null;
}

export function getLanguageLabel(code: string, locale: string): string {
  const displayNames = getDisplayNames(locale);
  if (!displayNames) return code;
  
  // Custom label fallbacks for better senior presentation
  if (code.startsWith('zh-Hans') || code === 'zh-CN' || code === 'zh') {
    return locale.startsWith('zh') ? '简体中文' : (displayNames.of('zh-Hans') || 'Chinese (Simplified)');
  }
  if (code.startsWith('zh-Hant') || code === 'zh-TW') {
    return locale.startsWith('zh') ? '繁體中文' : (displayNames.of('zh-Hant') || 'Chinese (Traditional)');
  }
  if (code.startsWith('th')) {
    return locale.startsWith('th') ? 'ไทย' : (displayNames.of('th') || 'Thai');
  }
  if (code.startsWith('en')) {
    return locale.startsWith('en') ? 'English' : (displayNames.of('en') || 'English');
  }

  return displayNames.of(code) || code;
}

export function buildLanguageOptions(locale: string): LanguageOption[] {
  const supportedCodes = ['en', 'zh-Hans', 'zh-Hant', 'th'];

  return supportedCodes.map((code) => ({
    code,
    label: getLanguageLabel(code, locale),
  }));
}
