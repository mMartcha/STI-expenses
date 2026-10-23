import { useNetworkState } from 'expo-network';
import { useTranslation } from 'react-i18next';

import { useSyncStatus, useUseCaseMutation } from '../../hooks/queries';
import { useDependencies } from '../../providers/DependenciesProvider';
import { Button } from '../Button';
import { Notice } from '../Notice';

/** Mostra quando o app está offline, com envios pendentes ou com falhas. */
export function SyncBanner() {
  const { t } = useTranslation();
  const network = useNetworkState();
  const { data } = useSyncStatus();
  const { retryFailedSyncUseCase } = useDependencies();
  const retry = useUseCaseMutation(() => retryFailedSyncUseCase.execute());

  const offline = network.isConnected === false || network.isInternetReachable === false;

  if (data && data.failed > 0) {
    return (
      <Notice
        tone="error"
        icon="warning"
        text={t('sync.failed')}
        action={<Button title={t('common.retry')} variant="ghost" loading={retry.isPending} onPress={() => retry.mutate(undefined)} />}
      />
    );
  }
  if (offline) return <Notice tone="warning" icon="offline" text={t('sync.offline')} />;
  if (data && data.pending > 0) return <Notice tone="info" icon="sync" text={t('sync.pending', { count: data.pending })} />;
  return null;
}
