import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Expense } from '@/domain/entities/Expense';
import { endOfDayIso, startOfDayIso, toDateKey } from '@/domain/shared/dates';

import { useExpenses, useReports } from '../../hooks/queries';
import { useStyles, useTheme } from '../../theme/theme';
import type { PeriodExpensePickerProps } from '../../types/component.types';
import { formatDate } from '../../utils/format';
import { AppText } from '../AppText';
import { EmptyState } from '../EmptyState';
import { ExpenseSelectRow } from '../expense/ExpenseSelectRow';
import { LoadingState } from '../LoadingState';
import { SectionTitle } from '../SectionTitle';
import { TextLink } from '../TextLink';
import { createStyles } from './styles';

interface PickerRow {
  expense: Expense;
  /** Título do relatório que já contém a despesa (ela não pode entrar em dois). */
  blockedBy: string | null;
}

/**
 * Todas as despesas do período/dias escolhidos, agrupadas por dia, para o usuário marcar quais
 * entram no relatório. Despesas que já pertencem a outro relatório aparecem desabilitadas.
 */
export function PeriodExpensePicker({ startDate, endDate, days, reportId, selected, onChange, onEditPeriod, footer }: PeriodExpensePickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const expensesQuery = useExpenses({ from: startOfDayIso(startDate), to: endOfDayIso(endDate) });
  const { data: reports = [] } = useReports();

  const sections = useMemo(() => {
    const titles = new Map(reports.map(({ report }) => [report.id, report.title]));
    const allowedDays = days ? new Set(days) : null;
    const byDay = new Map<string, PickerRow[]>();
    for (const expense of expensesQuery.data ?? []) {
      // Já está neste relatório: nada a escolher.
      if (reportId && expense.reportId === reportId) continue;
      const day = toDateKey(expense.occurredAt);
      if (allowedDays && !allowedDays.has(day)) continue;
      const blockedBy = expense.reportId ? (titles.get(expense.reportId) ?? t('reports.picker.anotherReport')) : null;
      byDay.set(day, [...(byDay.get(day) ?? []), { expense, blockedBy }]);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([day, data]) => ({ day, data }));
  }, [expensesQuery.data, reports, days, reportId, t]);

  const selectable = sections.flatMap((section) => section.data.filter((row) => !row.blockedBy && !row.expense.locked));
  const allSelected = selectable.length > 0 && selectable.every((row) => selected.has(row.expense.id));

  const toggle = (expenseId: string) => {
    const next = new Set(selected);
    if (next.has(expenseId)) next.delete(expenseId);
    else next.add(expenseId);
    onChange(next);
  };
  const toggleAll = () => onChange(allSelected ? new Set() : new Set(selectable.map((row) => row.expense.id)));

  const periodLabel = days
    ? days.map((day) => formatDate(day, { day: '2-digit', month: '2-digit' })).join(', ')
    : t('reports.period', { start: formatDate(startDate), end: formatDate(endDate) });

  if (expensesQuery.isLoading) return <LoadingState />;

  return (
    <View style={styles.pickerScreen}>
      <SectionList
        contentContainerStyle={styles.pickerContent}
        sections={sections}
        keyExtractor={(row) => row.expense.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.pickerHeader}>
            <View style={styles.pickerHeaderRow}>
              <AppText variant="heading" style={styles.flex} numberOfLines={2}>
                {periodLabel}
              </AppText>
              {onEditPeriod ? <TextLink label={t('reports.picker.editPeriod')} icon="edit" onPress={onEditPeriod} /> : null}
            </View>
            <AppText variant="caption" tone="secondary">
              {t('reports.picker.hint')}
            </AppText>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.pickerSection}>
            <SectionTitle
              title={formatDate(section.day, { weekday: 'short', day: '2-digit', month: '2-digit' })}
              right={
                section === sections[0] && selectable.length > 0 ? (
                  <TextLink label={allSelected ? t('reports.picker.clearAll') : t('reports.picker.selectAll')} onPress={toggleAll} />
                ) : undefined
              }
            />
          </View>
        )}
        renderItem={({ item: { expense, blockedBy } }) => (
          <ExpenseSelectRow
            expense={expense}
            checked={selected.has(expense.id)}
            onToggle={() => toggle(expense.id)}
            disabled={Boolean(blockedBy) || expense.locked}
            hint={blockedBy ? t('reports.picker.inReport', { title: blockedBy }) : null}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.pickerGap} />}
        ListEmptyComponent={<EmptyState icon="receipt" title={t('reports.picker.empty')} />}
      />
      <View style={[styles.pickerFooter, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>{footer}</View>
    </View>
  );
}
