import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { DomainError } from '@/core/errors';

import { useDependencies } from '../providers/DependenciesProvider';
import { useSessionStore } from '../stores/sessionStore';
import { useErrorAlert } from './useAsyncAction';

/** Sair da conta, avisando antes de descartar alterações ainda não enviadas. */
export function useSignOut() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { signOutUseCase } = useDependencies();
  const setUser = useSessionStore((state) => state.setUser);
  const setBiometricLock = useSessionStore((state) => state.setBiometricLock);
  const showError = useErrorAlert();
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
        Alert.alert(t('auth.signOutPendingTitle'), t('auth.signOutPendingMessage', { count: Number(error.details.count) }), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('auth.signOutConfirm'), style: 'destructive', onPress: () => void signOut(true) },
        ]);
      } else {
        showError(error);
      }
    } finally {
      setSigningOut(false);
    }
  };

  return { signOut: () => signOut(), signingOut };
}
