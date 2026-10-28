import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ReportDetailsInput } from '@/domain/entities/ExpenseReport';
import { toDateKey } from '@/domain/shared/dates';
import { DEFAULT_CURRENCY } from '@/domain/shared/Money';
import {
  AppText,
  Button,
  DateField,
  FormScreen,
  Icon,
  IconButton,
  ReportDetailsFields,
  SectionTitle,
  SegmentedControl,
} from '@/presentation/components';
import { useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorToast } from '@/presentation/hooks/useAsyncAction';
import { usePressScale } from '@/presentation/hooks/usePressScale';
import { useReportDetailsForm } from '@/presentation/hooks/useReportDetailsForm';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useConfirm } from '@/presentation/providers/DialogProvider';
import { summarizeSelection, useReportDraft, type DaySelection } from '@/presentation/providers/ReportDraftProvider';
import { useToast } from '@/presentation/providers/ToastProvider';
import { useTheme } from '@/presentation/theme/theme';
import type { ReportDateMode } from '@/presentation/types/component.types';
import { formatDate, formatMoney, parseDateValue } from '@/presentation/utils/format';

import { styles } from './styles';

/**
 * Novo relatório. Dias específicos: escolhe um dia → "Escolher despesas" → marca e salva → volta
 * aqui e repete com outro dia. Intervalo: o mesmo, com o período inteiro. "Criar relatório" grava
 * o relatório e vincula as despesas escolhidas (guardadas em `ReportDraftProvider`).
 */
export default function NewReportScreen() {
  const { t } = useTranslation();
  const draft = useReportDraft();
  const form = useReportDetailsForm();
  const { createReportUseCase, attachExpensesToReportUseCase } = useDependencies();
  const showError = useErrorToast();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const today = toDateKey(new Date());

  const [mode, setMode] = useState<ReportDateMode>('range');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [day, setDay] = useState(today);
  const range = { start: startDate, end: endDate < startDate ? startDate : endDate };

  const savedDays = [...draft.days.keys()].sort();
  const selection = mode === 'days' ? summarizeSelection(draft.days) : summarizeSelection(draft.range, range);

  const mutation = useUseCaseMutation(async ({ details, expenseIds }: { details: ReportDetailsInput; expenseIds: string[] }) => {
    const report = await createReportUseCase.execute(details);
    if (expenseIds.length > 0) await attachExpensesToReportUseCase.execute({ reportId: report.id, expenseIds });
    return report;
  });

  const openExpenses = (target: string | null) => {
    if (!form.validate()) return;
    router.push({
      pathname: '/report/new/expenses',
      params: target ? { day: target } : { start: range.start, end: range.end },
    });
  };

  const confirmRemoveDay = async (key: string) => {
    const confirmed = await confirm({
      title: t('reports.draft.removeDayTitle'),
      message: t('reports.draft.removeDayMessage', { day: formatDate(key) }),
      confirmLabel: t('reports.draft.removeDay'),
      destructive: true,
    });
    if (confirmed) draft.removeDay(key);
  };

  const create = () => {
    const details = form.validate();
    if (!details) return;
    // Dias específicos: o período vai do primeiro ao último dia salvo (sem dias, o dia do campo).
    const period =
      mode === 'range'
        ? { startDate: range.start, endDate: range.end }
        : { startDate: savedDays[0] ?? day, endDate: savedDays[savedDays.length - 1] ?? day };
    mutation.mutate(
      { details: { ...details, ...period }, expenseIds: selection.ids },
      {
        // Troca o modal inteiro pelo relatório criado.
        onSuccess: (report) => {
          showToast(t('toasts.reportCreated'), 'success');
          router.replace({ pathname: '/report/[id]', params: { id: report.id } });
        },
        onError: showError,
      },
    );
  };

  return (
    <FormScreen>
      <View style={styles.form}>
        <ReportDetailsFields form={form}>
          <SegmentedControl
            options={[
              { value: 'range', label: t('reports.dates.range'), icon: 'calendar' },
              { value: 'days', label: t('reports.dates.days'), icon: 'multiple' },
            ]}
            value={mode}
            onChange={setMode}
            size="sm"
          />
          {mode === 'days' ? (
            <DateField label={t('reports.draft.day')} value={parseDateValue(day)} onChange={(date) => setDay(toDateKey(date))} />
          ) : (
            <>
              <DateField label={t('expenses.fields.startDate')} value={parseDateValue(startDate)} onChange={(date) => setStartDate(toDateKey(date))} />
              <DateField
                label={t('expenses.fields.endDate')}
                value={parseDateValue(endDate)}
                minimumDate={parseDateValue(startDate)}
                onChange={(date) => setEndDate(toDateKey(date))}
              />
            </>
          )}
          <Button
            title={t('reports.draft.chooseExpenses')}
            icon="receipt"
            variant="secondary"
            onPress={() => openExpenses(mode === 'days' ? day : null)}
          />
          {mode === 'days' ? (
            savedDays.length > 0 ? (
              <View style={styles.days}>
                <SectionTitle title={t('reports.draft.daysAdded')} />
                {savedDays.map((key) => (
                  <DraftDayRow
                    key={key}
                    day={key}
                    selection={draft.days.get(key)!}
                    onOpen={() => {
                      setDay(key);
                      openExpenses(key);
                    }}
                    onRemove={() => confirmRemoveDay(key)}
                  />
                ))}
              </View>
            ) : null
          ) : selection.ids.length > 0 ? (
            <AppText variant="caption" tone="secondary" style={styles.summary}>
              {t('reports.draft.selected', { count: selection.ids.length, total: formatMoney(selection.total, DEFAULT_CURRENCY) })}
            </AppText>
          ) : null}
        </ReportDetailsFields>
        <Button
          title={selection.ids.length > 0 ? t('reports.draft.createWith', { count: selection.ids.length }) : t('reports.draft.create')}
          loading={mutation.isPending}
          onPress={create}
        />
      </View>
    </FormScreen>
  );
}

/** Dia salvo no rascunho: data, quantidade e valor; tocar reabre o dia, o ✕ remove. */
function DraftDayRow({ day, selection, onOpen, onRemove }: { day: string; selection: DaySelection; onOpen: () => void; onRemove: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const total = [...selection.values()].reduce((sum, amount) => sum + amount, 0);
  const label = formatDate(day, { weekday: 'short', day: '2-digit', month: '2-digit' });
  const press = usePressScale('card');

  return (
    <Animated.View style={[styles.dayRow, { backgroundColor: colors.surface, borderColor: colors.border }, press.animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${t('reports.draft.dayCount', { count: selection.size })}, ${formatMoney(total, DEFAULT_CURRENCY)}`}
        onPress={onOpen}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={({ pressed }) => [styles.dayRowMain, { opacity: pressed ? 0.7 : 1 }]}>
        <View style={styles.dayRowBody}>
          <AppText variant="heading" style={styles.capitalize}>
            {label}
          </AppText>
          <AppText variant="label" tone="secondary">
            {t('reports.draft.dayCount', { count: selection.size })}
          </AppText>
        </View>
        <AppText variant="subtitle" color={colors.primaryText} style={styles.tabular}>
          {formatMoney(total, DEFAULT_CURRENCY)}
        </AppText>
        <Icon name="chevronRight" color={colors.textSecondary} />
      </Pressable>
      <IconButton icon="close" accessibilityLabel={t('reports.draft.removeDay')} color={colors.textSecondary} onPress={onRemove} />
    </Animated.View>
  );
}
