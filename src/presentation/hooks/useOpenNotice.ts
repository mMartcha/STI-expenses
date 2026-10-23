import { router } from 'expo-router';

import type { Notice } from '@/domain/entities/Notice';

import { useDependencies } from '../providers/DependenciesProvider';
import { useUseCaseMutation } from './queries';

/** O que fazer ao tocar num aviso: reenviar (falha de envio) ou abrir a despesa/relatório. */
export function useOpenNotice() {
  const { retryFailedSyncUseCase } = useDependencies();
  const retrySync = useUseCaseMutation(() => retryFailedSyncUseCase.execute());

  return (notice: Notice) => {
    switch (notice.type) {
      case 'SYNC_FAILED':
        return retrySync.mutate(undefined);
      case 'OCR_FAILED':
        if (notice.targetId) router.push({ pathname: '/expense/[id]', params: { id: notice.targetId } });
        return;
      default:
        if (notice.targetId) router.push({ pathname: '/report/[id]', params: { id: notice.targetId } });
    }
  };
}
