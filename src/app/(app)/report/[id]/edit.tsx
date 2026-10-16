import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { ReportForm } from '@/presentation/components/ReportForm';
import { useReportDetails, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';

export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data } = useReportDetails(id);
  const { updateReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const mutation = useUseCaseMutation(updateReportUseCase.execute.bind(updateReportUseCase));

  if (!data) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  const { report } = data;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <ReportForm
          initial={{
            title: report.title,
            purpose: report.purpose,
            costCenter: report.costCenter,
            startDate: report.startDate,
            endDate: report.endDate,
            advance: report.advance?.amount ?? null,
          }}
          submitLabel={t('common.save')}
          loading={mutation.isPending}
          onSubmit={(details) =>
            mutation.mutate({ reportId: report.id, details }, { onSuccess: () => router.back(), onError: showError })
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
