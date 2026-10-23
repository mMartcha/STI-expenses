import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportForm } from '@/presentation/components/ReportForm';
import { useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';

export default function NewReportScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { createReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const mutation = useUseCaseMutation(createReportUseCase.execute.bind(createReportUseCase));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">
        <ReportForm
          submitLabel={t('common.save')}
          loading={mutation.isPending}
          onSubmit={(input) =>
            mutation.mutate(input, {
              onSuccess: (report) => router.replace({ pathname: '/report/[id]', params: { id: report.id } }),
              onError: showError,
            })
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
