import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ptBR from './locales/pt-BR';

/**
 * Para adicionar um idioma: crie `locales/<código>.ts` tipado com `TranslationResources`
 * e registre em `resources`. Por enquanto o app usa sempre `DEFAULT_LANGUAGE`, ignorando
 * o idioma do aparelho; a escolha pelo usuário (ou detecção via `expo-localization`) fica para depois.
 */
export const resources = {
  'pt-BR': { translation: ptBR },
  en: { translation: en },
} as const;

export type AppLanguage = keyof typeof resources;
export const DEFAULT_LANGUAGE: AppLanguage = 'pt-BR';

/** Locale para formatação de moeda e datas (Intl): acompanha o idioma ativo do app. */
export function currentLocale(): string {
  return i18n.language || DEFAULT_LANGUAGE;
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
