import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, LoadingState, PeriodExpensePicker } from '@/presentation/components';
import { useReportDetails, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useActionFeedback } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';

/**
 * Seleção múltipla das despesas do período do relatório para juntar nele. As que já estão em
 * outro relatório aparecem bloqueadas (uma despesa pertence a um único relatório).
 */
export default function AttachExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data } = useReportDetails(id);
  const { attachExpensesToReportUseCase } = useDependencies();
  const feedback = useActionFeedback();
  const attach = useUseCaseMutation(attachExpensesToReportUseCase.execute.bind(attachExpensesToReportUseCase));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!data) return <LoadingState />;
  const { report } = data;

  return (
    <PeriodExpensePicker
      startDate={report.startDate}
      endDate={report.endDate}
      reportId={report.id}
      selected={selected}
      onChange={setSelected}
      footer={
        <Button
          title={t('reports.attachSelected', { count: selected.size })}
          disabled={selected.size === 0}
          loading={attach.isPending}
          onPress={() =>
            attach.mutate({ reportId: id, expenseIds: [...selected] }, feedback(t('toasts.expensesAttached', { count: selected.size }), () => router.back()))
          }
        />
      }
    />
  );
}
