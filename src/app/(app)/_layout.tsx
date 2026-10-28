import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackScreenOptions } from '@/presentation/hooks/useStackScreenOptions';

export default function AppLayout() {
  const { t } = useTranslation();
  const screenOptions = useStackScreenOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: t('profile.title') }} />
      <Stack.Screen name="notifications" options={{ title: t('notices.title') }} />
      <Stack.Screen name="capture" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="expense/new" options={{ title: t('expenses.newManual'), presentation: 'modal' }} />
      <Stack.Screen name="expense/[id]/index" options={{ title: t('expenses.details') }} />
      <Stack.Screen name="expense/[id]/edit" options={{ title: t('common.edit'), presentation: 'modal' }} />
      <Stack.Screen name="expense/[id]/item" options={{ title: t('expenses.editItem'), presentation: 'modal' }} />
      <Stack.Screen name="expense/[id]/history" options={{ title: t('history.title') }} />
      <Stack.Screen name="expense/[id]/receipt" options={{ title: t('expenses.receipt'), presentation: 'fullScreenModal' }} />
      <Stack.Screen name="expense/[id]/move" options={{ title: t('expenses.chooseReport'), presentation: 'modal' }} />
      {/* Stack próprio (report/new/_layout): formulário → despesas de um dia → volta, tudo dentro do modal. */}
      <Stack.Screen name="report/new" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="report/[id]/index" options={{ title: t('reports.summary') }} />
      <Stack.Screen name="report/[id]/edit" options={{ title: t('reports.editTitle'), presentation: 'modal' }} />
      <Stack.Screen name="report/[id]/attach" options={{ title: t('reports.attachExpenses'), presentation: 'modal' }} />
      <Stack.Screen name="report/[id]/history" options={{ title: t('history.title') }} />
    </Stack>
  );
}
