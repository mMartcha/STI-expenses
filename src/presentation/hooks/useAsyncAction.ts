import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useDependencies } from '../providers/DependenciesProvider';
import { useToast } from '../providers/ToastProvider';
import { errorMessage } from '../utils/errors';

/** Envolve uma ação de tela: registra o erro e mostra a mensagem traduzida num toast de erro. */
export function useErrorToast() {
  const { t } = useTranslation();
  const { logger } = useDependencies();
  const { showToast } = useToast();

  return useCallback(
    (error: unknown) => {
      logger.warn('Ação falhou', { error: error instanceof Error ? error.message : String(error) });
      showToast(errorMessage(error, t), 'error');
    },
    [logger, showToast, t],
  );
}

/**
 * Opções de `mutation.mutate` com o retorno padrão de uma ação: toast de sucesso (e `after`,
 * ex.: voltar de tela) ou toast de erro.
 * `mutation.mutate(input, feedback(t('toasts.expenseUpdated'), () => router.back()))`
 */
export function useActionFeedback() {
  const { showToast } = useToast();
  const showError = useErrorToast();

  return useCallback(
    <TResult>(successMessage: string, after?: (result: TResult) => void) => ({
      onSuccess: (result: TResult) => {
        showToast(successMessage, 'success');
        after?.(result);
      },
      onError: showError,
    }),
    [showError, showToast],
  );
}
