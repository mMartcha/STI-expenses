import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ReportDetailsInput } from '@/domain/entities/ExpenseReport';
import { Button, FormScreen, PeriodExpensePicker, ReportForm } from '@/presentation/components';
import { useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';

interface Draft {
  details: ReportDetailsInput;
  /** Dias avulsos escolhidos; `null` = intervalo contínuo. */
  days: string[] | null;
}

/**
 * Novo relatório em duas etapas: (1) dados + período (intervalo ou dias avulsos) e (2) escolha das
 * despesas desse período. Só ao confirmar a 2ª etapa o relatório é criado e as despesas vinculadas.
 */
export default function NewReportScreen() {
  const { t } = useTranslation();
  const { createReportUseCase, attachExpensesToReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<'details' | 'expenses'>('details');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const mutation = useUseCaseMutation(async ({ details, expenseIds }: { details: ReportDetailsInput; expenseIds: string[] }) => {
    const report = await createReportUseCase.execute(details);
    if (expenseIds.length > 0) await attachExpensesToReportUseCase.execute({ reportId: report.id, expenseIds });
    return report;
  });

  if (draft && step === 'expenses') {
    return (
      <>
        <Stack.Screen options={{ title: t('reports.picker.title') }} />
        <PeriodExpensePicker
          startDate={draft.details.startDate}
          endDate={draft.details.endDate}
          days={draft.days}
          selected={selected}
          onChange={setSelected}
          onEditPeriod={() => setStep('details')}
          footer={
            <Button
              title={selected.size > 0 ? t('reports.picker.createWith', { count: selected.size }) : t('reports.picker.createEmpty')}
              loading={mutation.isPending}
              onPress={() =>
                mutation.mutate(
                  { details: draft.details, expenseIds: [...selected] },
                  {
                    onSuccess: (report) => router.replace({ pathname: '/report/[id]', params: { id: report.id } }),
                    onError: showError,
                  },
                )
              }
            />
          }
        />
      </>
    );
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: t('reports.new') }} />
      <ReportForm
        initial={draft?.details}
        initialDays={draft?.days}
        submitLabel={t('reports.picker.next')}
        loading={false}
        allowSpecificDays
        onSubmit={(details, days) => {
          // Se o período mudou, a seleção anterior pode ter despesas que nem aparecem mais.
          const samePeriod =
            draft?.details.startDate === details.startDate &&
            draft.details.endDate === details.endDate &&
            draft.days?.join() === days?.join();
          if (!samePeriod) setSelected(new Set());
          setDraft({ details, days });
          setStep('expenses');
        }}
      />
    </FormScreen>
  );
}
