import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Expense } from '@/domain/entities/Expense';
import { addDays, endOfDayIso, startOfDayIso, toDateKey } from '@/domain/shared/dates';
import { Money } from '@/domain/shared/Money';
import {
  AppText,
  Button,
  Card,
  CREATE_ACTIONS_CLEARANCE,
  CreateActions,
  EmptyState,
  ExpenseRow,
  IconButton,
  SegmentedControl,
  SyncBanner,
} from '@/presentation/components';
import { useExpenses, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate, formatDayHeader, formatMoney } from '@/presentation/utils/format';

import { styles } from './styles';

type ViewMode = 'day' | 'week';

/** Segunda-feira da semana que contém a data. */
function weekStart(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return addDays(dateKey, weekday === 0 ? -6 : 1 - weekday);
}

/** Despesas por dia ou por semana, com total do período e atalho para juntar a semana num relatório. */
export default function ExpensesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const today = toDateKey(new Date());

  const [mode, setMode] = useState<ViewMode>('day');
  const [anchor, setAnchor] = useState(today);

  const range = useMemo(() => {
    const start = mode === 'day' ? anchor : weekStart(anchor);
    const end = mode === 'day' ? anchor : addDays(start, 6);
    return { start, end, from: startOfDayIso(start), to: endOfDayIso(end) };
  }, [anchor, mode]);

  const { data: expenses = [], isLoading, refetch, isRefetching } = useExpenses({ from: range.from, to: range.to });

  const sections = useMemo(() => groupByDay(expenses), [expenses]);
  const total = useMemo(() => Money.sum(expenses.map((expense) => expense.total)), [expenses]);
  const unassigned = expenses.filter((expense) => !expense.reportId && !expense.locked);

  const periodLabel =
    mode === 'day'
      ? anchor === today
        ? t('common.today')
        : anchor === addDays(today, -1)
          ? t('common.yesterday')
          : formatDayHeader(anchor)
      : t('reports.period', { start: formatDate(range.start), end: formatDate(range.end) });

  const step = (direction: 1 | -1) => setAnchor((current) => addDays(current, direction * (mode === 'day' ? 1 : 7)));
  const atLatest = range.end >= today;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SectionList
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + CREATE_ACTIONS_CLEARANCE }]}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="title" accessibilityRole="header">
              {t('tabs.expenses')}
            </AppText>

            <SegmentedControl<ViewMode>
              value={mode}
              onChange={setMode}
              options={[
                { value: 'day', label: t('expenses.dayView') },
                { value: 'week', label: t('expenses.weekView') },
              ]}
            />

            <Card tone="brand">
              <View style={styles.navigator}>
                <IconButton icon="chevronLeft" color={colors.primaryText} accessibilityLabel={t('common.previous')} onPress={() => step(-1)} />
                <AppText variant="heading" style={styles.capitalize}>
                  {periodLabel}
                </AppText>
                <IconButton
                  icon="chevronRight"
                  color={atLatest ? colors.textDisabled : colors.primaryText}
                  accessibilityLabel={t('common.next')}
                  disabled={atLatest}
                  onPress={() => step(1)}
                />
              </View>
              <AppText variant="caption" tone="secondary">
                {mode === 'day' ? t('expenses.dayTotal') : t('expenses.weekTotal')}
              </AppText>
              <AppText variant="display" style={styles.total}>
                {formatMoney(total.amount, total.currency)}
              </AppText>
            </Card>

            <SyncBanner />

            {mode === 'week' && unassigned.length > 0 ? (
              <CreateWeekReportButton start={range.start} end={range.end} expenses={unassigned} />
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) =>
          mode === 'week' ? (
            <View style={styles.sectionHeader}>
              <AppText variant="label" tone="secondary" style={styles.capitalize}>
                {formatDayHeader(section.date)}
              </AppText>
              <AppText variant="label" tone="secondary">
                {formatMoney(section.total.amount, section.total.currency)}
              </AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => <ExpenseRow expense={item} />}
        ListEmptyComponent={isLoading ? null : <EmptyState icon="receipt" title={t('expenses.empty')} hint={t('expenses.emptyHint')} />}
      />
      <CreateActions />
    </View>
  );
}

/** "Juntar a semana": cria um relatório com o período da semana e anexa as despesas avulsas. */
function CreateWeekReportButton({ start, end, expenses }: { start: string; end: string; expenses: Expense[] }) {
  const { t } = useTranslation();
  const { createReportUseCase, attachExpensesToReportUseCase } = useDependencies();
  const showError = useErrorAlert();
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
        mutation.mutate(undefined, {
          onSuccess: (report) => router.push({ pathname: '/report/[id]', params: { id: report.id } }),
          onError: showError,
        })
      }
    />
  );
}

function groupByDay(expenses: Expense[]) {
  const map = new Map<string, { date: string; total: Money; data: Expense[] }>();
  for (const expense of expenses) {
    const key = toDateKey(expense.occurredAt);
    const section = map.get(key) ?? { date: key, total: Money.zero(expense.currency), data: [] };
    section.total = section.total.add(expense.total);
    section.data.push(expense);
    map.set(key, section);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}
