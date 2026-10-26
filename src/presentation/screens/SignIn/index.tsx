import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { AppText, Button, Notice } from '@/presentation/components';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { useTheme } from '@/presentation/theme/theme';
import { errorMessage } from '@/presentation/utils/errors';

import { styles } from './styles';

/** `authorizing` = buscando a URL e com o navegador aberto; `validating` = trocando o code pelo JWT. */
type Phase = 'idle' | 'authorizing' | 'validating';

/** Entrar com a conta corporativa (Entra ID): o login acontece na página da Microsoft, não no app. */
export default function SignInScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signInUseCase, getBiometricLockUseCase, setBiometricLockUseCase, logger } = useDependencies();
  const setUser = useSessionStore((state) => state.setUser);
  const setBiometricLock = useSessionStore((state) => state.setBiometricLock);

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  /** Depois do primeiro login, oferece a biometria uma vez (se o aparelho tiver trava). Nunca impede a entrada. */
  const offerBiometricLock = async () => {
    try {
      const lock = await getBiometricLockUseCase.execute();
      if (!lock.available || lock.asked) return setBiometricLock(lock.enabled);
      const accepted = await new Promise<boolean>((resolve) =>
        Alert.alert(
          t('auth.biometricOffer.title'),
          t('auth.biometricOffer.message'),
          [
            { text: t('auth.biometricOffer.decline'), style: 'cancel', onPress: () => resolve(false) },
            { text: t('auth.biometricOffer.accept'), onPress: () => resolve(true) },
          ],
          { cancelable: false },
        ),
      );
      setBiometricLock(await setBiometricLockUseCase.execute({ enabled: accepted, prompt: t('auth.biometricOffer.prompt') }));
    } catch (error) {
      logger.warn('Falha ao configurar a biometria', { error });
    }
  };

  const signIn = async () => {
    setPhase('authorizing');
    setError(null);
    try {
      const user = await signInUseCase.execute({ onValidating: () => setPhase('validating') });
      // `null` = o usuário fechou o navegador: volta ao início sem mensagem de erro.
      // Com usuário, o Stack.Protected do layout raiz redireciona para a área logada.
      if (user) {
        await offerBiometricLock();
        setUser(user);
      }
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setPhase('idle');
    }
  };

  return (
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
          <AppText variant="display" tone="brand" style={styles.centered}>
            {t('auth.title')}
          </AppText>
          <AppText tone="secondary" style={styles.centered}>
            {t('auth.subtitle')}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        {error ? <Notice tone="error" icon="warning" text={error} /> : null}
        <Button title={t('auth.signIn')} icon="lock" loading={phase !== 'idle'} onPress={signIn} />
        <AppText variant="caption" tone="secondary" style={styles.hint} accessibilityLiveRegion="polite">
          {phase === 'validating' ? t('auth.validating') : t('auth.signInHint')}
        </AppText>
        {env.useMocks ? <Notice tone="info" icon="person" text={t('auth.mockHint')} /> : null}
      </View>
    </View>
  );
}
