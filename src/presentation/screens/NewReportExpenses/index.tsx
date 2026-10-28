import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { endOfDayIso, startOfDayIso } from '@/domain/shared/dates';
import { Button, PeriodExpensePicker } from '@/presentation/components';
import { useExpenses } from '@/presentation/hooks/queries';
import { summarizeSelection, useReportDraft } from '@/presentation/providers/ReportDraftProvider';
import { formatDate } from '@/presentation/utils/format';

/**
 * Despesas de um dia (`?day=`) ou de um intervalo (`?start=&end=`) para o novo relatório.
 * "Salvar" grava no rascunho e volta ao formulário; sair pelo voltar descarta o que mudou aqui.
 */
export default function NewReportExpensesScreen() {
  const params = useLocalSearchParams<{ day?: string; start?: string; end?: string }>();
  const { t } = useTranslation();
  const draft = useReportDraft();
  const day = params.day ?? null;
  const period = day ? { start: day, end: day } : { start: params.start!, end: params.end! };

  // Mesma consulta do `PeriodExpensePicker` (mesma chave de cache): serve para salvar as despesas escolhidas.
  const { data: expenses = [] } = useExpenses({ from: startOfDayIso(period.start), to: endOfDayIso(period.end) });
  const [selected, setSelected] = useState<Set<string>>(() =>
    day ? new Set(draft.days.get(day)?.keys()) : new Set(summarizeSelection(draft.range, period).ids),
  );

  const save = () => {
    const picked = expenses.filter((expense) => selected.has(expense.id));
    if (day) draft.saveDay(day, picked);
    else draft.saveRange(picked);
    router.back();
  };

  return (
    <>
      {day ? <Stack.Screen options={{ title: formatDate(day, { weekday: 'short', day: '2-digit', month: '2-digit' }) }} /> : null}
      <PeriodExpensePicker
        startDate={period.start}
        endDate={period.end}
        selected={selected}
        onChange={setSelected}
        footer={
          <Button
            title={selected.size > 0 ? t('reports.draft.saveWith', { count: selected.size }) : t('reports.draft.saveNone')}
            onPress={save}
          />
        }
      />
    </>
  );
}
