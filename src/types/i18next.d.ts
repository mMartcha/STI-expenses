import 'i18next';

import type { TranslationResources } from '@/presentation/i18n/locales/pt-BR';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: TranslationResources };
  }
}
