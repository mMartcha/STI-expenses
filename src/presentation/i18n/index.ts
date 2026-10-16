import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ptBR from './locales/pt-BR';

/**
 * Para adicionar um idioma: crie `locales/<código>.ts` tipado com `TranslationResources`
 * e registre em `resources`. O idioma do aparelho é usado automaticamente.
 */
export const resources = {
  'pt-BR': { translation: ptBR },
  en: { translation: en },
} as const;

export type AppLanguage = keyof typeof resources;
export const FALLBACK_LANGUAGE: AppLanguage = 'pt-BR';

function detectLanguage(): AppLanguage {
  for (const locale of getLocales()) {
    if (locale.languageTag in resources) return locale.languageTag as AppLanguage;
    const base = locale.languageCode;
    if (base === 'pt') return 'pt-BR';
    if (base && base in resources) return base as AppLanguage;
  }
  return FALLBACK_LANGUAGE;
}

/** Locale para formatação de moeda e datas (Intl). */
export function currentLocale(): string {
  return getLocales()[0]?.languageTag ?? 'pt-BR';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
