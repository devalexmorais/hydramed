import { useSettingsStore } from '@/stores/useSettingsStore';
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';
import { es } from './locales/es';

type Locale = 'en' | 'pt-BR' | 'es';
type TranslationMap = Record<string, Record<string, string>>;

const translations: TranslationMap = {
  en,
  'pt-BR': ptBR,
  es,
};

function lookup(key: string, locale: string, params?: Record<string, string | number>): string {
  const dict = translations[locale] ?? translations.en;
  const text = dict[key] ?? translations.en[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function useTranslation() {
  const locale = useSettingsStore((s) => s.locale);

  function $t(key: string): string;
  function $t(key: string, params: Record<string, string | number>): string;
  function $t(key: string, params?: Record<string, string | number>): string {
    return lookup(key, locale, params);
  }

  return { t: $t, locale };
}

export function getGreeting(locale: string = 'en'): string {
  const hour = new Date().getHours();
  const key = hour < 12 ? 'greeting.morning' : hour < 17 ? 'greeting.afternoon' : 'greeting.evening';
  return lookup(key, locale);
}

export function t(key: string, locale: string = 'en', params?: Record<string, string | number>): string {
  return lookup(key, locale, params);
}

export function translateUnit(unit: string, locale: string = 'en'): string {
  const key = `medAdd.${unit}`;
  const translated = translations[locale]?.[key] ?? translations.en?.[key];
  return translated ?? unit;
}

export type { Locale };
