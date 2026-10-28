import { useNetworkState } from 'expo-network';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Button,
  Card,
  Divider,
  ExpenseRow,
  IconButton,
  LoadingState,
  Notice,
  Pill,
  Row,
  SectionTitle,
} from '@/presentation/components';
import { useReportDetails, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorToast } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useConfirm } from '@/presentation/providers/DialogProvider';
import { useToast } from '@/presentation/providers/ToastProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate, formatDayHeader, formatMoney } from '@/presentation/utils/format';
import { CATEGORY_ICON, REPORT_STATUS_TONE } from '@/presentation/utils/status';

import { styles } from './styles';

/** Relatório consolidado ("despesa múltipla"): totais, saldo do adiantamento e despesas por dia. */
export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const network = useNetworkState();
  const { data, isLoading } = useReportDetails(id);
  const { submitReportUseCase, deleteReportUseCase } = useDependencies();
  const showError = useErrorToast();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const submit = useUseCaseMutation(submitReportUseCase.execute.bind(submitReportUseCase));
  const remove = useUseCaseMutation(deleteReportUseCase.execute.bind(deleteReportUseCase));

  if (isLoading || !data) return <LoadingState />;

  const { report, summary } = data;
  const editable = report.isEditable;
  const currency = report.currency;
  const offline = network.isConnected === false || network.isInternetReachable === false;

  const confirmSubmit = async () => {
    const confirmed = await confirm({
      title: t('reports.submitTitle'),
      message: t('reports.submitMessage', { total: formatMoney(summary.total.amount, currency) }),
      confirmLabel: t('reports.submit'),
    });
    if (!confirmed) return;
    submit.mutate(
      { reportId: report.id },
      {
        onSuccess: () => (offline ? showToast(t('reports.submittedOffline'), 'info') : showToast(t('toasts.reportSubmitted'), 'success')),
        onError: showError,
      },
    );
  };

  const confirmDelete = async () => {
    const confirmed = await confirm({
      title: t('reports.deleteTitle'),
      message: t('reports.deleteMessage'),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!confirmed) return;
    remove.mutate(
      { reportId: report.id },
      {
        onSuccess: () => {
          showToast(t('toasts.reportDeleted'), 'success');
          router.back();
        },
        onError: showError,
      },
    );
  };

  const balance = summary.advanceBalance;

  return (
    <>
      <Stack.Screen
        options={{
          title: report.title,
          headerRight: () =>
            editable ? (
              <IconButton
                icon="edit"
                color={colors.primaryText}
                accessibilityLabel={t('common.edit')}
                onPress={() => router.push({ pathname: '/report/[id]/edit', params: { id: report.id } })}
              />
            ) : null,
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 64 }]}>
        {report.status === 'APPROVED' ? <Notice tone="success" icon="lock" text={t('reports.approvedLocked')} /> : null}
        {report.status === 'REJECTED' ? <Notice tone="error" icon="warning" text={t('reports.rejectedLocked')} /> : null}
        {report.decisionNote ? <Notice tone="info" icon="person" text={t('reports.decisionNote', { note: report.decisionNote })} /> : null}
        {summary.outOfPeriodIds.length > 0 ? (
          <Notice tone="warning" icon="calendar" text={t('reports.outOfPeriod', { count: summary.outOfPeriodIds.length })} />
        ) : null}
        {summary.pendingOcrIds.length > 0 ? (
          <Notice tone="info" icon="sync" text={t('reports.pendingOcr', { count: summary.pendingOcrIds.length })} />
        ) : null}

        <Card tone="brand">
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
          {report.purpose ? <AppText tone="primary">{report.purpose}</AppText> : null}
          <AppText variant="caption" tone="primary">
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
            <Row strong label={t('common.total')} value={formatMoney(summary.total.amount, currency)} valueColor={colors.primaryText} />
          )}
        </Card>

        {summary.byCategory.length > 0 ? (
          <>
            <SectionTitle title={t('reports.byCategory')} />
            <Card>
              {summary.byCategory.map(({ category, total }) => (
                <Row key={category} icon={CATEGORY_ICON[category]} label={t(`categories.${category}`)} value={formatMoney(total.amount, currency)} />
              ))}
            </Card>
          </>
        ) : null}

        <SectionTitle title={t('reports.byDay')} />
        {editable ? (
          <View style={styles.actions}>
            <Button
              title={t('reports.attachExpensesButton')}
              icon="add"
              variant="secondary"
              style={styles.flex}
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
          <View key={day.date} style={styles.day}>
            <View style={styles.dayHeader}>
              <AppText variant="label" tone="secondary" style={styles.capitalize}>
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
            style={styles.submit}
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
