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
  return displayNames.of(code) || code;
}

export function buildLanguageOptions(locale: string): LanguageOption[] {
  const displayNames = getDisplayNames(locale);
  let codes: string[] = [];

  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      codes = (Intl as any).supportedValuesOf('language') as string[];
    }
  } catch {
    codes = [];
  }

  const options =
    codes.length > 0
      ? codes.map((code) => ({
          code,
          label: displayNames?.of(code) || code,
        }))
      : FALLBACK_LANGUAGES;

  return options.sort((a, b) => a.label.localeCompare(b.label));
}
