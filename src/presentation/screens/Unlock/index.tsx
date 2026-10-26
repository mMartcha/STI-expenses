import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button } from '@/presentation/components';
import { useSignOut } from '@/presentation/hooks/useSignOut';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

/**
 * Tela de desbloqueio por biometria. É um `Modal` sobre a navegação (não uma rota): ao
 * desbloquear, o usuário volta exatamente onde estava, inclusive com formulários abertos.
 */
export default function UnlockScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { unlockWithBiometricsUseCase, logger } = useDependencies();
  const locked = useSessionStore((state) => state.status === 'locked');
  const user = useSessionStore((state) => state.user);
  const unlock = useSessionStore((state) => state.unlock);
  const { signOut, signingOut } = useSignOut();
  const [authenticating, setAuthenticating] = useState(false);

  const authenticate = async () => {
    setAuthenticating(true);
    try {
      if (await unlockWithBiometricsUseCase.execute({ prompt: t('auth.unlock.prompt') })) unlock();
    } catch (error) {
      // Falha do sistema (ex.: muitas tentativas): fica na tela; o botão permite tentar de novo.
      logger.warn('Falha na biometria', { error });
    } finally {
      setAuthenticating(false);
    }
  };

  return (
    // `onShow`: pede a biometria assim que a tela aparece, sem exigir um toque a mais.
    <Modal
      visible={locked}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onShow={() => void authenticate()}
      onRequestClose={() => {}}>
      <View
        style={[
          styles.screen,
          { backgroundColor: colors.background, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}>
        <View style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Image source={require('@/assets/images/splash-icon.png')} style={styles.logoImage} contentFit="contain" />
          </View>
          <View style={styles.titles}>
            <AppText variant="title" style={styles.centered}>
              {t('auth.unlock.title', { name: user?.name.split(' ')[0] ?? '' })}
            </AppText>
            <AppText tone="secondary" style={styles.centered}>
              {t('auth.unlock.subtitle')}
            </AppText>
          </View>
        </View>

        <View style={styles.actions}>
          <Button title={t('auth.unlock.action')} icon="lock" loading={authenticating} onPress={authenticate} />
          <Button title={t('auth.unlock.signOut')} variant="ghost" loading={signingOut} onPress={signOut} />
        </View>
      </View>
    </Modal>
  );
}
