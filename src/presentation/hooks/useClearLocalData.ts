import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DomainError } from '@/core/errors';

import { useDependencies } from '../providers/DependenciesProvider';
import { useConfirm } from '../providers/DialogProvider';
import { useToast } from '../providers/ToastProvider';
import { useSessionStore } from '../stores/sessionStore';
import { useErrorToast } from './useAsyncAction';

/**
 * "Excluir dados locais" do perfil: confirma, avisa se há itens não enviados (como o "Sair") e,
 * depois de apagar, relê a trava por biometria (a preferência some junto) e revalida as telas.
 */
export function useClearLocalData() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { clearLocalDataUseCase, getBiometricLockUseCase } = useDependencies();
  const setBiometricLock = useSessionStore((state) => state.setBiometricLock);
  const confirm = useConfirm();
  const { showToast } = useToast();
  const showError = useErrorToast();
  const [clearing, setClearing] = useState(false);

  const run = async (force: boolean): Promise<void> => {
    setClearing(true);
    try {
      await clearLocalDataUseCase.execute({ force });
      setBiometricLock((await getBiometricLockUseCase.execute()).enabled);
      await queryClient.invalidateQueries();
      showToast(t('toasts.localDataCleared'), 'success');
    } catch (error) {
      if (error instanceof DomainError && error.code === 'PENDING_SYNC') {
        const confirmed = await confirm({
          title: t('profile.clearData.pendingTitle'),
          message: t('profile.clearData.pendingMessage', { count: Number(error.details.count) }),
          confirmLabel: t('profile.clearData.confirm'),
          destructive: true,
        });
        if (confirmed) await run(true);
      } else {
        showError(error);
      }
    } finally {
      setClearing(false);
    }
  };

  const clearLocalData = async () => {
    const confirmed = await confirm({
      title: t('profile.clearData.title'),
      message: t('profile.clearData.message'),
      confirmLabel: t('profile.clearData.confirm'),
      destructive: true,
    });
    if (confirmed) await run(false);
  };

  return { clearLocalData, clearing };
}
