import { create } from 'zustand';
import { mmkv } from '@/lib/mmkv';
import en from '../../../messages/en.json';
import th from '../../../messages/th.json';
import zh from '../../../messages/zh.json';
import { devLog } from '@/lib/devLogger';

const LOCALE_STORAGE_KEY = 'app.locale';

type Dictionary = Record<string, any>;

const dictionaries: Record<string, Dictionary> = {
  en,
  th,
  zh,
  'th-TH': th,
  'en-US': en,
  'en-GB': en,
  'zh-CN': zh,
  'zh-TW': zh,
  'zh-Hans': zh,
  'zh-Hant': zh,
  'zh-HK': zh,
};

function getDefaultLocale(): string {
  const stored = mmkv.getString(LOCALE_STORAGE_KEY);
  if (stored && (dictionaries[stored] || stored.startsWith('th') || stored.startsWith('zh'))) {
    if (stored.startsWith('th')) return 'th';
    if (stored.startsWith('zh')) return 'zh';
    return stored;
  }
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale.startsWith('th')) return 'th';
    if (locale.startsWith('zh')) return 'zh';
    return 'en';
  } catch {
    return 'en';
  }
}

function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj as Record<string, unknown> | undefined;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part] as Record<string, unknown> | undefined;
  }
  return typeof current === 'string' ? current : undefined;
}

function replaceParams(text: string, params?: Record<string, unknown>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined && params[key] !== null ? String(params[key]) : match;
  });
}

export interface I18nState {
  locale: string;
  setLocale: (code: string) => void;
  getTranslation: (key: string, params?: Record<string, unknown>) => string;
}

export const useI18nStore = create<I18nState>((set, get) => ({
  locale: getDefaultLocale(),
  setLocale: (code: string) => {
    let normalized = 'en';
    if (code.startsWith('th')) normalized = 'th';
    else if (code.startsWith('zh')) normalized = 'zh';
    else if (dictionaries[code]) normalized = code;
    mmkv.set(LOCALE_STORAGE_KEY, normalized);
    set({ locale: normalized });
    devLog.info(`[i18nStore] Changed locale to ${normalized}`);
  },
  getTranslation: (key: string, params?: Record<string, unknown>) => {
    const { locale } = get();
    const dict = dictionaries[locale] || dictionaries.en;
    let template = getNestedValue(dict, key);

    // Fallback to English
    if (template === undefined && locale !== 'en') {
      template = getNestedValue(dictionaries.en, key);
    }

    // Fallback to key itself
    if (template === undefined) {
      devLog.warn(`[i18nStore] Missing translation for key: "${key}" in locale: "${locale}"`);
      return key.split('.').pop() ?? key;
    }

    return replaceParams(template, params);
  },
}));
