export type LanguageOption = {
  code: string;
  label: string;
};

const FALLBACK_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-Hans', label: 'Chinese (Simplified)' },
  { code: 'zh-Hant', label: 'Chinese (Traditional)' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'id', label: 'Indonesian' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'tr', label: 'Turkish' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'da', label: 'Danish' },
  { code: 'no', label: 'Norwegian' },
];

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
