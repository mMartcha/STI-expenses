import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ReportListItem } from '@/domain/usecases/report/ListReportsUseCase';
import { CREATE_ACTIONS_CLEARANCE, CreateActions } from '@/presentation/components/CreateActions';
import { Icon } from '@/presentation/components/Icon';
import { SyncBanner } from '@/presentation/components/SyncBanner';
import { AppText, EmptyState, Pill } from '@/presentation/components/ui';
import { useReports } from '@/presentation/hooks/queries';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate, formatMoney } from '@/presentation/utils/format';
import { REPORT_STATUS_TONE } from '@/presentation/utils/status';

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data = [], isLoading, refetch, isRefetching } = useReports();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + CREATE_ACTIONS_CLEARANCE, paddingHorizontal: 16, gap: 10 }}
        data={data}
        keyExtractor={(item) => item.report.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 6 }}>
            <AppText variant="title">{t('reports.title')}</AppText>
            <SyncBanner />
          </View>
        }
        renderItem={({ item }) => <ReportCard item={item} />}
        ListEmptyComponent={isLoading ? null : <EmptyState icon="report" title={t('reports.empty')} hint={t('reports.emptyHint')} />}
      />
      <CreateActions />
    </View>
  );
}

function ReportCard({ item }: { item: ReportListItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { report } = item;

  return (
    <Link href={{ pathname: '/report/[id]', params: { id: report.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
        ]}>
        <View style={{ flex: 1, gap: 4 }}>
          <AppText variant="heading" numberOfLines={1}>
            {report.title}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {t('reports.period', { start: formatDate(report.startDate), end: formatDate(report.endDate) })} ·{' '}
            {t('reports.expensesCount', { count: item.expenseCount })}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pill tone={REPORT_STATUS_TONE[report.status]} label={t(`reports.status.${report.status}`)} />
            {report.syncStatus === 'FAILED' ? <Pill tone="error" label={t('sync.status.FAILED')} /> : null}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <AppText variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
            {formatMoney(item.total.amount, item.total.currency)}
          </AppText>
          <Icon name="chevronRight" color={colors.textTertiary} size={16} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
