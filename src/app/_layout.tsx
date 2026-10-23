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
import { useColorScheme, View } from 'react-native';

import { container } from '@/di/container';
import { db } from '@/infra/database/client';
import migrations from '@/infra/database/migrations/migrations';
import { ICON_FONT } from '@/presentation/components/Icon';
import { AppText } from '@/presentation/components/ui';
import { createQueryClient } from '@/presentation/hooks/queries';
import { DependenciesProvider } from '@/presentation/providers/DependenciesProvider';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { darkColors, lightColors } from '@/presentation/theme/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const [queryClient] = useState(createQueryClient);
  const { success, error } = useMigrations(db, migrations);
  // Se a fonte falhar, segue com a do sistema em vez de travar o app.
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    ...ICON_FONT,
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
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </DependenciesProvider>
  );
}

/** Restaura a sessão, liga a sincronização e decide quais rotas ficam acessíveis. */
function SessionGate() {
  const status = useSessionStore((state) => state.status);
  const setUser = useSessionStore((state) => state.setUser);

  useEffect(() => {
    container.restoreSessionUseCase
      .execute()
      .then(setUser)
      .catch((error) => {
        container.logger.error('Falha ao restaurar sessão', error);
        setUser(null);
      })
      .finally(() => void SplashScreen.hideAsync());
  }, [setUser]);

  // Sincroniza apenas com usuário autenticado.
  useEffect(() => {
    if (status !== 'signedIn') return;
    return container.syncEngine.start();
  }, [status]);

  if (status === 'restoring') return null;

  return (
    <>
      <SyncInvalidator />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === 'signedIn'}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </>
  );
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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
      <AppText variant="title">{t('common.unknownError')}</AppText>
      <AppText tone="secondary">{__DEV__ ? message : null}</AppText>
    </View>
  );
}
