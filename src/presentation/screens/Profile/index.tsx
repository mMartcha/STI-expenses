import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { AppText, Avatar, Button, Card, Divider, Row, SectionTitle, SyncBanner } from '@/presentation/components';
import { useSyncStatus } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useSignOut } from '@/presentation/hooks/useSignOut';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

/** Perfil: identidade, estado da sincronização, segurança, ambiente e sair. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { getBiometricLockUseCase, setBiometricLockUseCase } = useDependencies();
  const user = useSessionStore((state) => state.user);
  const biometricLock = useSessionStore((state) => state.biometricLock);
  const setBiometricLock = useSessionStore((state) => state.setBiometricLock);
  const { data: sync } = useSyncStatus();
  const { data: lockStatus } = useQuery({ queryKey: ['biometricLock'], queryFn: () => getBiometricLockUseCase.execute() });
  const showError = useErrorAlert();
  const { signOut, signingOut } = useSignOut();
  const [savingLock, setSavingLock] = useState(false);

  const toggleBiometricLock = async (enabled: boolean) => {
    setSavingLock(true);
    try {
      setBiometricLock(await setBiometricLockUseCase.execute({ enabled, prompt: t('auth.biometricOffer.prompt') }));
    } catch (error) {
      showError(error);
    } finally {
      setSavingLock(false);
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

      <SectionTitle title={t('profile.security')} />
      <Card>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <AppText>{t('profile.biometric')}</AppText>
            <AppText variant="caption" tone="secondary">
              {lockStatus && !lockStatus.available ? t('profile.biometricUnavailable') : t('profile.biometricHint')}
            </AppText>
          </View>
          <Switch
            value={biometricLock}
            onValueChange={toggleBiometricLock}
            disabled={savingLock || !lockStatus?.available}
            trackColor={{ true: colors.primary }}
            accessibilityLabel={t('profile.biometric')}
          />
        </View>
      </Card>

      <Card>
        <Row label={t('profile.environment')} value={env.appEnv} />
        {env.useMocks ? <Row label={t('profile.mocks')} value="✓" /> : null}
        <Row label={t('profile.version')} value={Constants.expoConfig?.version ?? '-'} />
      </Card>

      <View>
        <Button title={t('auth.signOut')} icon="logout" variant="danger" loading={signingOut} onPress={signOut} />
      </View>
    </ScrollView>
  );
}
