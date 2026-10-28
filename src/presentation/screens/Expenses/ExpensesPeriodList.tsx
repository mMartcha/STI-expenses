import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Expense } from '@/domain/entities/Expense';
import { toDateKey } from '@/domain/shared/dates';
import { Money } from '@/domain/shared/Money';
import { AppText, CREATE_ACTIONS_CLEARANCE, EmptyState, ExpenseRow } from '@/presentation/components';
import { useTheme } from '@/presentation/theme/theme';
import { formatDayHeader, formatMoney } from '@/presentation/utils/format';

import { styles } from './styles';

interface ExpensesPeriodListProps {
  expenses: Expense[];
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
  /** Topo da página (período, total, banner…), rola junto com a lista. */
  header: ReactElement;
  /** Na semana, cada dia ganha um cabeçalho com a data e o total. */
  showDayHeaders?: boolean;
}

/** Lista de uma página da aba Despesas: agrupada por dia, com "puxar para atualizar" e estado vazio. */
export function ExpensesPeriodList({ expenses, isLoading, isRefetching, refetch, header, showDayHeaders = false }: ExpensesPeriodListProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sections = useMemo(() => groupByDay(expenses), [expenses]);

  return (
    <SectionList
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CREATE_ACTIONS_CLEARANCE }]}
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) =>
        showDayHeaders ? (
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
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.listLoading} accessibilityLabel={t('common.loading')} />
        ) : (
          <EmptyState icon="receipt" title={t('expenses.empty')} hint={t('expenses.emptyHint')} />
        )
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
