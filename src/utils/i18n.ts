import ja from '../locales/ja.json' assert { type: 'json' };
import zh from '../locales/zh.json' assert { type: 'json' };
import en from '../locales/en.json' assert { type: 'json' };

type Locale = 'ja' | 'zh' | 'en';

const translations = {
  ja,
  zh,
  en,
};

export function getTranslation(locale: Locale = 'ja', key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];

  for (const k of keys) {
    value = value?.[k];
  }

  return typeof value === 'string' ? value : key;
}

export function detectLocale(acceptLanguage?: string): Locale {
  if (!acceptLanguage) return 'ja';

  const lang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();

  switch (lang) {
    case 'ja':
      return 'ja';
    case 'zh':
      return 'zh';
    case 'en':
      return 'en';
    default:
      return 'ja';
  }
}
