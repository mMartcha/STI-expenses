import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { endOfDayIso, startOfDayIso } from '@/domain/shared/dates';
import { Money } from '@/domain/shared/Money';
import { AppText, SyncBanner } from '@/presentation/components';
import { useExpenses } from '@/presentation/hooks/queries';
import { formatDayHeader, formatMoney } from '@/presentation/utils/format';

import { ExpensesPeriodList } from './ExpensesPeriodList';
import { styles } from './styles';
import { TotalCard } from './TotalCard';

/** Página "Dia": sempre o dia atual, com o total do dia. */
export function DayPage({ today }: { today: string }) {
  const { t } = useTranslation();
  const { data: expenses = [], isLoading, refetch, isRefetching } = useExpenses({ from: startOfDayIso(today), to: endOfDayIso(today) });
  const total = useMemo(() => Money.sum(expenses.map((expense) => expense.total)), [expenses]);

  return (
    <ExpensesPeriodList
      expenses={expenses}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
      header={
        <View style={styles.pageHeader}>
          <View style={styles.period}>
            {/* Mesma altura da linha com setas da semana, para o conteúdo não "pular" entre as páginas. */}
            <View style={[styles.navigator, styles.dayHeader]}>
              <AppText variant="heading" style={styles.capitalize}>
                {formatDayHeader(today)}
              </AppText>
            </View>
            <TotalCard label={t('expenses.dayTotal')} value={formatMoney(total.amount, total.currency)} loading={isLoading} />
          </View>
          <SyncBanner />
        </View>
      }
    />
  );
}
