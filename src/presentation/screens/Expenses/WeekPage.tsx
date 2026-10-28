import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { addDays, endOfDayIso, startOfDayIso } from '@/domain/shared/dates';
import { Money } from '@/domain/shared/Money';
import { AppText, IconButton, SyncBanner } from '@/presentation/components';
import { useExpenses } from '@/presentation/hooks/queries';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate, formatMoney } from '@/presentation/utils/format';
import { haptics } from '@/presentation/utils/haptics';

import { CreateWeekReportButton } from './CreateWeekReportButton';
import { ExpensesPeriodList } from './ExpensesPeriodList';
import { styles } from './styles';
import { TotalCard } from './TotalCard';

/** Segunda-feira da semana que contém a data. */
function weekStart(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return addDays(dateKey, weekday === 0 ? -6 : 1 - weekday);
}

/** Página "Semana": navega semana a semana (até a atual), com total e atalho para juntar a semana num relatório. */
export function WeekPage({ today }: { today: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [anchor, setAnchor] = useState(today);

  const range = useMemo(() => {
    const start = weekStart(anchor);
    const end = addDays(start, 6);
    return { start, end, from: startOfDayIso(start), to: endOfDayIso(end) };
  }, [anchor]);

  const { data: expenses = [], isLoading, refetch, isRefetching } = useExpenses({ from: range.from, to: range.to });
  const total = useMemo(() => Money.sum(expenses.map((expense) => expense.total)), [expenses]);
  const unassigned = expenses.filter((expense) => !expense.reportId && !expense.locked);
  const atLatest = range.end >= today;

  const step = (direction: 1 | -1) => {
    haptics.selection();
    setAnchor((current) => addDays(current, direction * 7));
  };

  return (
    <ExpensesPeriodList
      expenses={expenses}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
      showDayHeaders
      header={
        <View style={styles.pageHeader}>
          <View style={styles.period}>
            <View style={styles.navigator}>
              <IconButton icon="chevronLeft" color={colors.primaryText} accessibilityLabel={t('common.previous')} onPress={() => step(-1)} />
              <AppText variant="heading" style={styles.capitalize}>
                {t('reports.period', { start: formatDate(range.start), end: formatDate(range.end) })}
              </AppText>
              <IconButton
                icon="chevronRight"
                color={atLatest ? colors.textDisabled : colors.primaryText}
                accessibilityLabel={t('common.next')}
                disabled={atLatest}
                onPress={() => step(1)}
              />
            </View>
            <TotalCard label={t('expenses.weekTotal')} value={formatMoney(total.amount, total.currency)} loading={isLoading} />
          </View>
          <SyncBanner />
          {unassigned.length > 0 ? <CreateWeekReportButton start={range.start} end={range.end} expenses={unassigned} /> : null}
        </View>
      }
    />
  );
}
