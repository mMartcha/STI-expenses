import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DomainError } from '@/core/errors';

import { useDependencies } from '../providers/DependenciesProvider';
import { useConfirm } from '../providers/DialogProvider';
import { useSessionStore } from '../stores/sessionStore';
import { useErrorToast } from './useAsyncAction';

/** Sair da conta, avisando antes de descartar alterações ainda não enviadas. */
export function useSignOut() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { signOutUseCase } = useDependencies();
  const setUser = useSessionStore((state) => state.setUser);
  const setBiometricLock = useSessionStore((state) => state.setBiometricLock);
  const showError = useErrorToast();
  const confirm = useConfirm();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async (force = false) => {
    setSigningOut(true);
    try {
      await signOutUseCase.execute({ force });
      queryClient.clear();
      setBiometricLock(false);
      setUser(null);
    } catch (error) {
      if (error instanceof DomainError && error.code === 'PENDING_SYNC') {
        const confirmed = await confirm({
          title: t('auth.signOutPendingTitle'),
          message: t('auth.signOutPendingMessage', { count: Number(error.details.count) }),
          confirmLabel: t('auth.signOutConfirm'),
          destructive: true,
        });
        if (confirmed) await signOut(true);
      } else {
        showError(error);
      }
    } finally {
      setSigningOut(false);
    }
  };

  return { signOut: () => signOut(), signingOut };
}
