import '@/presentation/i18n';

import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts,
} from '@expo-google-fonts/montserrat';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, View } from 'react-native';

import { container } from '@/di/container';
import { db } from '@/infra/database/client';
import migrations from '@/infra/database/migrations/migrations';
import { AppText } from '@/presentation/components';
import { createQueryClient } from '@/presentation/hooks/queries';
import { DependenciesProvider } from '@/presentation/providers/DependenciesProvider';
import UnlockScreen from '@/presentation/screens/Unlock';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { darkColors, lightColors, useAppColorScheme } from '@/presentation/theme/theme';

void SplashScreen.preventAutoHideAsync();

/** Tempo fora do app (em segundo plano) a partir do qual a biometria é pedida de novo. */
const RELOCK_AFTER_MS = 5 * 60_000;

export default function RootLayout() {
  const scheme = useAppColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const [queryClient] = useState(createQueryClient);
  const { success, error } = useMigrations(db, migrations);
  // Se a fonte falhar, segue com a do sistema em vez de travar o app.
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const navigationTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  if (error) return <FatalError message={error.message} />;
  if (!success || (!fontsLoaded && !fontError)) return null;

  return (
    <DependenciesProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={theme}>
          <SessionGate />
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </QueryClientProvider>
    </DependenciesProvider>
  );
}

/** Restaura a sessão, liga a sincronização e decide quais rotas ficam acessíveis. */
function SessionGate() {
  const status = useSessionStore((state) => state.status);
  const setUser = useSessionStore((state) => state.setUser);
  const setBiometricLock = useSessionStore((state) => state.setBiometricLock);
  const hasSession = status === 'signedIn' || status === 'locked';

  useEffect(() => {
    const restore = async () => {
      const user = await container.restoreSessionUseCase.execute();
      if (!user) return setUser(null);
      const lock = await container.getBiometricLockUseCase.execute();
      setBiometricLock(lock.enabled);
      // Com a trava ligada, o app já abre bloqueado (a biometria é pedida na tela de desbloqueio).
      setUser(user, { locked: lock.enabled && lock.available });
    };
    restore()
      .catch((error) => {
        container.logger.error('Falha ao restaurar sessão', error);
        setUser(null);
      })
      .finally(() => void SplashScreen.hideAsync());
  }, [setUser, setBiometricLock]);

  useRelockAfterBackground();

  // Sincroniza com sessão ativa, inclusive com o app bloqueado (os dados continuam subindo).
  useEffect(() => {
    if (!hasSession) return;
    return container.syncEngine.start();
  }, [hasSession]);

  if (status === 'restoring') return null;

  return (
    <>
      <SyncInvalidator />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Bloqueado continua com acesso às rotas: a tela de desbloqueio cobre sem desmontar a navegação. */}
        <Stack.Protected guard={hasSession}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <UnlockScreen />
    </>
  );
}

/** Trava de novo quando o app volta depois de `RELOCK_AFTER_MS` em segundo plano (com a biometria ligada). */
function useRelockAfterBackground() {
  useEffect(() => {
    let backgroundAt: number | null = null;
    const subscription = AppState.addEventListener('change', (next) => {
      // Só `background` conta: o próprio pedido de biometria deixa o app `inactive` no iOS.
      if (next === 'background') {
        backgroundAt = Date.now();
      } else if (next === 'active' && backgroundAt !== null) {
        const elapsed = Date.now() - backgroundAt;
        backgroundAt = null;
        const { biometricLock, lock } = useSessionStore.getState();
        if (biometricLock && elapsed >= RELOCK_AFTER_MS) lock();
      }
    });
    return () => subscription.remove();
  }, []);
}

/** Quando uma rodada de sincronização altera dados (ex.: OCR concluído), atualiza as telas. */
function SyncInvalidator() {
  const queryClient = useQueryClient();
  useEffect(() => container.syncEngine.subscribe(() => void queryClient.invalidateQueries()), [queryClient]);
  return null;
}

function FatalError({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.fatal}>
      <AppText variant="title">{t('common.unknownError')}</AppText>
      <AppText tone="secondary">{__DEV__ ? message : null}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fatal: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
});
