import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { FormScreen, ReportForm } from '@/presentation/components';
import { useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';

/** Novo relatório; ao salvar, abre o relatório criado. */
export default function NewReportScreen() {
  const { t } = useTranslation();
  const { createReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const mutation = useUseCaseMutation(createReportUseCase.execute.bind(createReportUseCase));

  return (
    <FormScreen>
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
    </FormScreen>
  );
}
