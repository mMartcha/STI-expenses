import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FormScreen, LoadingState, ReportForm } from '@/presentation/components';
import { useReportDetails, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';

/** Editar os dados do relatório (enquanto não aprovado). */
export default function EditReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data } = useReportDetails(id);
  const { updateReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const mutation = useUseCaseMutation(updateReportUseCase.execute.bind(updateReportUseCase));

  if (!data) return <LoadingState />;
  const { report } = data;

  return (
    <FormScreen>
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
        onSubmit={(details) => mutation.mutate({ reportId: report.id, details }, { onSuccess: () => router.back(), onError: showError })}
      />
    </FormScreen>
  );
}
