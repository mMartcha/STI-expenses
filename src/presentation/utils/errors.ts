import type { TFunction } from 'i18next';

import { DomainError, RemoteError } from '@/core/errors';

import { NativeModuleUnavailableError } from './openReceipt';

/** Converte qualquer erro em mensagem amigável traduzida (nunca expõe detalhes técnicos). */
export function errorMessage(error: unknown, t: TFunction): string {
  if (error instanceof DomainError) {
    if (error.code === 'VALIDATION') {
      const field = String(error.details.field ?? '');
      const label = t(`expenses.fields.${field}` as 'expenses.fields.description', { defaultValue: field });
      return t('errors.VALIDATION', { field: label });
    }
    return t(`errors.${error.code}`);
  }
  if (error instanceof RemoteError) return t('errors.network');
  if (error instanceof NativeModuleUnavailableError) return t('errors.nativeUnavailable');
  return t('common.unknownError');
}
