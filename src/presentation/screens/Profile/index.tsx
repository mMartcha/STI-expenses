import { useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { DomainError } from '@/core/errors';
import { AppText, Avatar, Button, Card, Divider, Row, SectionTitle, SyncBanner } from '@/presentation/components';
import { useSyncStatus } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

/** Perfil: identidade, estado da sincronização, ambiente e sair. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { signOutUseCase } = useDependencies();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const { data: sync } = useSyncStatus();
  const showError = useErrorAlert();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async (force = false) => {
    setSigningOut(true);
    try {
      await signOutUseCase.execute({ force });
      queryClient.clear();
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

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
      <Card style={styles.identity}>
        <Avatar name={user?.name} size={72} />
        <View style={styles.identityText}>
          <AppText variant="title">{user?.name}</AppText>
          <AppText tone="secondary">{user?.email}</AppText>
        </View>
      </Card>

      <SectionTitle title={t('profile.sync')} />
      <Card>
        <Row label={t('sync.status.PENDING')} value={String(sync?.pending ?? 0)} />
        <Row label={t('sync.status.FAILED')} value={String(sync?.failed ?? 0)} valueColor={sync?.failed ? colors.error : undefined} />
        <Divider />
        <SyncBanner />
        {sync && sync.pending === 0 && sync.failed === 0 ? (
          <AppText tone="secondary" variant="caption">
            {t('sync.synced')}
          </AppText>
        ) : null}
      </Card>

      <Card>
        <Row label={t('profile.environment')} value={env.appEnv} />
        {env.useMocks ? <Row label={t('profile.mocks')} value="✓" /> : null}
        <Row label={t('profile.version')} value={Constants.expoConfig?.version ?? '-'} />
      </Card>

      <View>
        <Button title={t('auth.signOut')} icon="logout" variant="danger" loading={signingOut} onPress={() => signOut()} />
      </View>
    </ScrollView>
  );
}
