import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import type { Expense } from '@/domain/entities/Expense';
import { Button } from '@/presentation/components';
import { useUseCaseMutation } from '@/presentation/hooks/queries';
import { useActionFeedback } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { formatDate } from '@/presentation/utils/format';

/** "Juntar a semana": cria um relatório com o período da semana e anexa as despesas avulsas. */
export function CreateWeekReportButton({ start, end, expenses }: { start: string; end: string; expenses: Expense[] }) {
  const { t } = useTranslation();
  const { createReportUseCase, attachExpensesToReportUseCase } = useDependencies();
  const feedback = useActionFeedback();
  const mutation = useUseCaseMutation(async () => {
    const report = await createReportUseCase.execute({
      title: t('expenses.weekReportTitle', { start: formatDate(start), end: formatDate(end) }),
      startDate: start,
      endDate: end,
    });
    await attachExpensesToReportUseCase.execute({ reportId: report.id, expenseIds: expenses.map((e) => e.id) });
    return report;
  });

  return (
    <Button
      title={t('expenses.createWeekReport')}
      icon="report"
      variant="secondary"
      loading={mutation.isPending}
      onPress={() =>
        mutation.mutate(
          undefined,
          feedback(t('toasts.reportCreated'), (report) => router.push({ pathname: '/report/[id]', params: { id: report.id } })),
        )
      }
    />
  );
}
