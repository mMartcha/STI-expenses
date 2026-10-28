import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackScreenOptions } from '@/presentation/hooks/useStackScreenOptions';
import { ReportDraftProvider } from '@/presentation/providers/ReportDraftProvider';

/** Stack do modal "novo relatório": as telas compartilham o rascunho (despesas escolhidas por dia). */
export default function NewReportLayout() {
  const { t } = useTranslation();
  const screenOptions = useStackScreenOptions();

  return (
    <ReportDraftProvider>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={{ title: t('reports.new') }} />
        <Stack.Screen name="expenses" options={{ title: t('reports.picker.title') }} />
      </Stack>
    </ReportDraftProvider>
  );
}
