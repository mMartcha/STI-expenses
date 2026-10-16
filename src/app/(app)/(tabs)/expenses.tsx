import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Expense } from '@/domain/entities/Expense';
import { addDays, endOfDayIso, startOfDayIso, toDateKey } from '@/domain/shared/dates';
import { Money } from '@/domain/shared/Money';
import { ExpenseRow } from '@/presentation/components/ExpenseRow';
import { Icon } from '@/presentation/components/Icon';
import { SyncBanner } from '@/presentation/components/SyncBanner';
import { AppText, Button, Card, EmptyState } from '@/presentation/components/ui';
import { useExpenses, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useReceiptCapture } from '@/presentation/hooks/useReceiptCapture';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate, formatDayHeader, formatMoney } from '@/presentation/utils/format';

type ViewMode = 'day' | 'week';

/** Segunda-feira da semana que contém a data. */
function weekStart(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return addDays(dateKey, weekday === 0 ? -6 : 1 - weekday);
}

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
  const { scan, isProcessing } = useReceiptCapture();

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

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 120, paddingHorizontal: 16, gap: 8 }}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View style={{ gap: 16, marginBottom: 8 }}>
          <AppText variant="title">{t('tabs.expenses')}</AppText>

          <View style={[styles.segment, { backgroundColor: colors.surfaceMuted }]}>
            {(['day', 'week'] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === value }}
                onPress={() => setMode(value)}
                style={[styles.segmentItem, mode === value && { backgroundColor: colors.surface }]}>
                <AppText variant="label" color={mode === value ? colors.primary : colors.textSecondary}>
                  {value === 'day' ? t('expenses.dayView') : t('expenses.weekView')}
                </AppText>
              </Pressable>
            ))}
          </View>

          <Card style={{ backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder }}>
            <View style={styles.navigator}>
              <Pressable accessibilityRole="button" accessibilityLabel="anterior" onPress={() => step(-1)} hitSlop={12}>
                <Icon name="chevronLeft" color={colors.primary} />
              </Pressable>
              <AppText variant="heading" style={{ textTransform: 'capitalize' }}>
                {periodLabel}
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="próximo"
                onPress={() => step(1)}
                hitSlop={12}
                disabled={range.end >= today}>
                <Icon name="chevronRight" color={range.end >= today ? colors.textDisabled : colors.primary} />
              </Pressable>
            </View>
            <AppText variant="caption" tone="secondary">
              {mode === 'day' ? t('expenses.dayTotal') : t('expenses.weekTotal')}
            </AppText>
            <AppText variant="display" color={colors.primary} style={{ fontVariant: ['tabular-nums'] }}>
              {formatMoney(total.amount, total.currency)}
            </AppText>
          </Card>

          <View style={styles.actions}>
            <Button title={t('home.scan')} icon="scan" onPress={scan} loading={isProcessing} style={{ flex: 1 }} />
            <Button title={t('expenses.manual')} icon="manual" variant="secondary" onPress={() => router.push('/expense/new')} style={{ flex: 1 }} />
          </View>

          <SyncBanner />

          {mode === 'week' && unassigned.length > 0 ? (
            <CreateWeekReportButton start={range.start} end={range.end} expenses={unassigned} />
          ) : null}
        </View>
      }
      renderSectionHeader={({ section }) =>
        mode === 'week' ? (
          <View style={styles.sectionHeader}>
            <AppText variant="label" tone="secondary" style={{ textTransform: 'capitalize' }}>
              {formatDayHeader(section.date)}
            </AppText>
            <AppText variant="label" tone="secondary">
              {formatMoney(section.total.amount, section.total.currency)}
            </AppText>
          </View>
        ) : null
      }
      renderItem={({ item }) => <ExpenseRow expense={item} />}
      ListEmptyComponent={
        isLoading ? null : <EmptyState icon="receipt" title={t('expenses.empty')} hint={t('expenses.emptyHint')} />
      }
    />
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

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  navigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
});
