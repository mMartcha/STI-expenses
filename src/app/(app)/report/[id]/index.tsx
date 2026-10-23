import { useNetworkState } from 'expo-network';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseRow } from '@/presentation/components/ExpenseRow';
import { Icon } from '@/presentation/components/Icon';
import { AppText, Button, Card, Divider, Notice, Pill, Row, SectionTitle } from '@/presentation/components/ui';
import { useReportDetails, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate, formatDayHeader, formatMoney } from '@/presentation/utils/format';
import { REPORT_STATUS_TONE } from '@/presentation/utils/status';

/** Relatório consolidado ("despesa múltipla"): totais, saldo do adiantamento e despesas por dia. */
export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const network = useNetworkState();
  const { data, isLoading } = useReportDetails(id);
  const { submitReportUseCase, deleteReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const submit = useUseCaseMutation(submitReportUseCase.execute.bind(submitReportUseCase));
  const remove = useUseCaseMutation(deleteReportUseCase.execute.bind(deleteReportUseCase));

  if (isLoading || !data) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;

  const { report, summary } = data;
  const editable = report.isEditable;
  const currency = report.currency;
  const offline = network.isConnected === false || network.isInternetReachable === false;

  const confirmSubmit = () =>
    Alert.alert(t('reports.submitTitle'), t('reports.submitMessage', { total: formatMoney(summary.total.amount, currency) }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('reports.submit'),
        onPress: () =>
          submit.mutate(
            { reportId: report.id },
            { onSuccess: () => (offline ? Alert.alert(t('reports.submittedOffline')) : undefined), onError: showError },
          ),
      },
    ]);

  const confirmDelete = () =>
    Alert.alert(t('reports.deleteTitle'), t('reports.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove.mutate({ reportId: report.id }, { onSuccess: () => router.back(), onError: showError }),
      },
    ]);

  const balance = summary.advanceBalance;

  return (
    <>
      <Stack.Screen
        options={{
          title: report.title,
          headerRight: () =>
            editable ? (
              <Link href={{ pathname: '/report/[id]/edit', params: { id: report.id } }} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={t('common.edit')} hitSlop={12}>
                  <Icon name="edit" color={colors.primary} />
                </Pressable>
              </Link>
            ) : null,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 64 }}>
        {report.status === 'APPROVED' ? <Notice tone="success" icon="lock" text={t('reports.approvedLocked')} /> : null}
        {report.status === 'REJECTED' ? <Notice tone="error" icon="warning" text={t('reports.rejectedLocked')} /> : null}
        {report.decisionNote ? <Notice tone="info" icon="person" text={t('reports.decisionNote', { note: report.decisionNote })} /> : null}
        {summary.outOfPeriodIds.length > 0 ? (
          <Notice tone="warning" icon="calendar" text={t('reports.outOfPeriod', { count: summary.outOfPeriodIds.length })} />
        ) : null}
        {summary.pendingOcrIds.length > 0 ? (
          <Notice tone="info" icon="sync" text={t('reports.pendingOcr', { count: summary.pendingOcrIds.length })} />
        ) : null}

        <Card style={{ backgroundColor: colors.primarySurface, borderColor: colors.primaryBorder }}>
          <View style={styles.headerRow}>
            <Pill tone={REPORT_STATUS_TONE[report.status]} label={t(`reports.status.${report.status}`)} />
            {report.syncStatus !== 'SYNCED' ? (
              <Pill tone={report.syncStatus === 'FAILED' ? 'error' : 'neutral'} label={t(`sync.status.${report.syncStatus}`)} />
            ) : null}
          </View>
          <AppText variant="caption" tone="secondary">
            {t('reports.period', { start: formatDate(report.startDate), end: formatDate(report.endDate) })}
            {report.costCenter ? ` · ${report.costCenter}` : ''}
          </AppText>
          {report.purpose ? <AppText tone="secondary">{report.purpose}</AppText> : null}
          <AppText variant="display" color={colors.primary} style={{ fontVariant: ['tabular-nums'] }}>
            {formatMoney(summary.total.amount, currency)}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {t('reports.expensesCount', { count: summary.expenseCount })}
          </AppText>
        </Card>

        <Card>
          {!summary.excluded.isZero() ? (
            <Row label={t('expenses.excluded')} value={`− ${formatMoney(summary.excluded.amount, currency)}`} valueColor={colors.warning} />
          ) : null}
          {report.advance ? (
            <>
              <Row label={t('expenses.fields.advance')} value={formatMoney(report.advance.amount, currency)} />
              <Row label={t('common.total')} value={`− ${formatMoney(summary.total.amount, currency)}`} />
              <Divider />
            </>
          ) : null}
          {balance ? (
            <Row
              strong
              label={balance.isNegative() ? t('reports.advanceBalanceReceive') : t('reports.advanceBalanceReturn')}
              value={formatMoney(Math.abs(balance.amount), currency)}
              valueColor={balance.isNegative() ? colors.success : colors.warning}
            />
          ) : (
            <Row strong label={t('common.total')} value={formatMoney(summary.total.amount, currency)} valueColor={colors.primary} />
          )}
        </Card>

        {summary.byCategory.length > 0 ? (
          <>
            <SectionTitle title={t('reports.byCategory')} />
            <Card>
              {summary.byCategory.map(({ category, total }) => (
                <Row key={category} label={t(`categories.${category}`)} value={formatMoney(total.amount, currency)} />
              ))}
            </Card>
          </>
        ) : null}

        <SectionTitle title={t('reports.byDay')} />
        {editable ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              title={t('reports.attachExpensesButton')}
              icon="add"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/report/[id]/attach', params: { id: report.id } })}
            />
            <Button
              title={t('expenses.manual')}
              icon="manual"
              variant="secondary"
              onPress={() => router.push({ pathname: '/expense/new', params: { reportId: report.id } })}
            />
          </View>
        ) : null}

        {summary.days.map((day) => (
          <View key={day.date} style={{ gap: 8 }}>
            <View style={styles.dayHeader}>
              <AppText variant="label" tone="secondary" style={{ textTransform: 'capitalize' }}>
                {formatDayHeader(day.date)}
              </AppText>
              <AppText variant="label" tone="secondary">
                {formatMoney(day.total.amount, currency)}
              </AppText>
            </View>
            {day.expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </View>
        ))}

        {report.status === 'DRAFT' ? (
          <Button
            title={t('reports.submit')}
            icon="check"
            loading={submit.isPending}
            disabled={summary.expenseCount === 0}
            onPress={confirmSubmit}
            style={{ marginTop: 12 }}
          />
        ) : null}
        <Button
          title={t('common.seeHistory')}
          variant="ghost"
          icon="history"
          onPress={() => router.push({ pathname: '/report/[id]/history', params: { id: report.id } })}
        />
        {report.isDeletable ? (
          <Button title={t('common.delete')} variant="danger" icon="delete" loading={remove.isPending} onPress={confirmDelete} />
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', gap: 6 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
