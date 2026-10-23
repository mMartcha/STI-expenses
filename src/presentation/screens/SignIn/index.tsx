import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { env } from '@/config/env';
import { AppText, Button, Notice, TextField } from '@/presentation/components';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { useTheme } from '@/presentation/theme/theme';
import { errorMessage } from '@/presentation/utils/errors';

import { styles } from './styles';

/** Entrar com e-mail corporativo e senha (no modo simulado, qualquer e-mail e 6+ caracteres). */
export default function SignInScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signInUseCase } = useDependencies();
  const setUser = useSessionStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInUseCase.execute({ email, password });
      // O Stack.Protected do layout raiz redireciona para a área logada.
      setUser(user);
    } catch (err) {
      setError(errorMessage(err, t));
    } finally {
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Image source={require('@/assets/images/splash-icon.png')} style={styles.logoImage} contentFit="contain" />
        </View>
        <View style={styles.titles}>
          <AppText variant="display" tone="brand">
            {t('auth.title')}
          </AppText>
          <AppText tone="secondary">{t('auth.subtitle')}</AppText>
        </View>

        <View style={styles.form}>
          <TextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
          />
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          {error ? <Notice tone="error" icon="warning" text={error} /> : null}
          <Button title={t('auth.signIn')} loading={loading} onPress={submit} disabled={!email || !password} />
          {env.useMocks ? <Notice tone="info" icon="person" text={t('auth.mockHint')} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
