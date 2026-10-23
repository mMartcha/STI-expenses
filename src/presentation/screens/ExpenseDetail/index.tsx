import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ExpenseItem } from '@/domain/entities/Expense';
import { isPdf } from '@/domain/gateways/ReceiptStorage';
import {
  AppText,
  Button,
  Card,
  Divider,
  ExpenseItemRow,
  IconButton,
  LoadingState,
  Notice,
  Pill,
  ReasonDialog,
  ReceiptThumbnail,
  Row,
  SectionTitle,
  TextLink,
} from '@/presentation/components';
import { useExpense, useReportDetails, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDateTime, formatMoney } from '@/presentation/utils/format';
import { openReceiptDocument } from '@/presentation/utils/openReceipt';
import { REPORT_STATUS_TONE } from '@/presentation/utils/status';

import { styles } from './styles';

/** Detalhe da despesa: comprovante, itens (editar/remover), totais, relatório e histórico. */
export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: expense, isLoading } = useExpense(id);
  const { data: reportDetails } = useReportDetails(expense?.reportId ?? null);
  const deps = useDependencies();
  const showError = useErrorAlert();

  const [removing, setRemoving] = useState<ExpenseItem | null>(null);
  const removeItem = useUseCaseMutation(deps.removeExpenseItemUseCase.execute.bind(deps.removeExpenseItemUseCase));
  const restoreItem = useUseCaseMutation(deps.restoreExpenseItemUseCase.execute.bind(deps.restoreExpenseItemUseCase));
  const retryOcr = useUseCaseMutation(deps.retryOcrUseCase.execute.bind(deps.retryOcrUseCase));
  const deleteExpense = useUseCaseMutation(deps.deleteExpenseUseCase.execute.bind(deps.deleteExpenseUseCase));
  const detach = useUseCaseMutation(deps.detachExpenseFromReportUseCase.execute.bind(deps.detachExpenseFromReportUseCase));

  if (isLoading || !expense) return <LoadingState />;

  const report = reportDetails?.report ?? null;
  const editable = !expense.locked && (report?.isEditable ?? true);
  const title = expense.description || expense.merchant?.name || t('expenses.untitled');
  const receipt = expense.receipt;

  const openReceipt = () => {
    if (!receipt) return;
    if (isPdf(receipt.mimeType)) openReceiptDocument(receipt).catch(showError);
    else router.push({ pathname: '/expense/[id]/receipt', params: { id: expense.id } });
  };

  const confirmDelete = () =>
    Alert.alert(t('expenses.deleteTitle'), t('expenses.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteExpense.mutate({ expenseId: expense.id }, { onSuccess: () => router.back(), onError: showError }),
      },
    ]);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () =>
            editable ? (
              <IconButton
                icon="edit"
                color={colors.primaryText}
                accessibilityLabel={t('common.edit')}
                onPress={() => router.push({ pathname: '/expense/[id]/edit', params: { id: expense.id } })}
              />
            ) : null,
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 64 }]}>
        {expense.locked || (report && !report.isEditable) ? <Notice tone="success" icon="lock" text={t('expenses.locked')} /> : null}

        {expense.ocrStatus === 'PENDING' ? (
          <Notice tone="info" icon="sync" text={`${t('expenses.reading')} ${t('expenses.readingHint')}`} action={<ActivityIndicator color={colors.info} />} />
        ) : null}
        {expense.ocrStatus === 'FAILED' ? (
          <Notice
            tone="warning"
            icon="warning"
            text={`${t('expenses.ocrFailed')} ${t('expenses.ocrFailedHint')}`}
            action={
              editable ? (
                <Button
                  title={t('common.retry')}
                  variant="ghost"
                  loading={retryOcr.isPending}
                  onPress={() => retryOcr.mutate({ expenseId: expense.id }, { onError: showError })}
                />
              ) : undefined
            }
          />
        ) : null}

        {/* Cabeçalho */}
        <Card>
          <View style={styles.header}>
            {receipt ? (
              <ReceiptThumbnail
                receipt={receipt}
                size="lg"
                accessibilityLabel={isPdf(receipt.mimeType) ? t('expenses.openPdf') : t('expenses.viewReceipt')}
                onPress={openReceipt}
              />
            ) : null}
            <View style={styles.headerBody}>
              <AppText variant="heading">{title}</AppText>
              {expense.merchant?.taxId ? (
                <AppText variant="caption" tone="secondary">
                  {t('expenses.fields.merchantTaxId')}: {expense.merchant.taxId}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="secondary">
                {formatDateTime(expense.occurredAt)}
              </AppText>
              <View style={styles.pills}>
                <Pill tone="primary" label={t(`categories.${expense.category}`)} />
                {expense.paymentMethod ? <Pill label={t(`paymentMethods.${expense.paymentMethod}`)} /> : null}
                <Pill
                  tone={expense.syncStatus === 'FAILED' ? 'error' : expense.syncStatus === 'SYNCED' ? 'success' : 'neutral'}
                  label={t(`sync.status.${expense.syncStatus}`)}
                />
              </View>
            </View>
          </View>
          {expense.notes ? <AppText tone="secondary">{expense.notes}</AppText> : null}
        </Card>

        {/* Itens */}
        <SectionTitle
          title={t('expenses.items')}
          right={
            editable ? (
              <TextLink
                icon="add"
                label={t('expenses.addItem')}
                onPress={() => router.push({ pathname: '/expense/[id]/item', params: { id: expense.id } })}
              />
            ) : null
          }
        />
        <Card style={styles.items}>
          {expense.activeItems.length === 0 ? (
            <AppText tone="secondary" style={styles.empty}>
              —
            </AppText>
          ) : null}
          {expense.activeItems.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <Divider /> : null}
              <ExpenseItemRow expense={expense} item={item} editable={editable} busy={removeItem.isPending} onRemove={() => setRemoving(item)} />
            </View>
          ))}
        </Card>

        {expense.removedItems.length > 0 ? (
          <>
            <SectionTitle title={t('expenses.removedItems')} />
            <Card tone="muted" style={styles.items}>
              {expense.removedItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <Divider /> : null}
                  <ExpenseItemRow
                    expense={expense}
                    item={item}
                    editable={editable}
                    busy={restoreItem.isPending}
                    onRestore={() => restoreItem.mutate({ expenseId: expense.id, itemId: item.id }, { onError: showError })}
                  />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {/* Totais */}
        <Card>
          <Row label={t('expenses.subtotal')} value={formatMoney(expense.subtotal.amount, expense.currency)} />
          {!expense.discount.isZero() ? (
            <Row
              label={expense.removedItems.length > 0 ? t('expenses.proportionalDiscount') : t('expenses.discount')}
              value={`− ${formatMoney(expense.effectiveDiscount.amount, expense.currency)}`}
            />
          ) : null}
          {!expense.excludedAmount.isZero() ? (
            <Row label={t('expenses.excluded')} value={`− ${formatMoney(expense.excludedAmount.amount, expense.currency)}`} valueColor={colors.warning} />
          ) : null}
          <Divider />
          <Row label={t('common.total')} value={formatMoney(expense.total.amount, expense.currency)} strong valueColor={colors.primaryText} />
        </Card>

        {/* Relatório */}
        <SectionTitle title={t('expenses.fields.reportId')} />
        <Card>
          {report ? (
            <>
              <View style={styles.reportRow}>
                <AppText variant="heading" style={styles.reportTitle} numberOfLines={1}>
                  {report.title}
                </AppText>
                <Pill tone={REPORT_STATUS_TONE[report.status]} label={t(`reports.status.${report.status}`)} />
              </View>
              <Button
                title={t('expenses.openReport')}
                variant="secondary"
                icon="report"
                onPress={() => router.push({ pathname: '/report/[id]', params: { id: report.id } })}
              />
              {editable ? (
                <Button
                  title={t('expenses.removeFromReport')}
                  variant="ghost"
                  loading={detach.isPending}
                  onPress={() => detach.mutate({ reportId: report.id, expenseId: expense.id }, { onError: showError })}
                />
              ) : null}
            </>
          ) : (
            <>
              <Pill label={t('expenses.standalone')} />
              <Button
                title={t('expenses.addToReport')}
                variant="secondary"
                icon="report"
                onPress={() => router.push({ pathname: '/expense/[id]/move', params: { id: expense.id } })}
              />
            </>
          )}
        </Card>

        <Button
          title={t('common.seeHistory')}
          variant="ghost"
          icon="history"
          onPress={() => router.push({ pathname: '/expense/[id]/history', params: { id: expense.id } })}
        />
        {editable ? <Button title={t('common.delete')} variant="danger" icon="delete" loading={deleteExpense.isPending} onPress={confirmDelete} /> : null}
      </ScrollView>

      <ReasonDialog
        visible={removing !== null}
        title={t('expenses.removeReasonTitle')}
        message={t('expenses.removeReasonMessage')}
        placeholder={t('expenses.removeReasonPlaceholder')}
        confirmLabel={t('expenses.removeItem')}
        onCancel={() => setRemoving(null)}
        onConfirm={(reason) => {
          if (removing) removeItem.mutate({ expenseId: expense.id, itemId: removing.id, reason: reason || null }, { onError: showError });
          setRemoving(null);
        }}
      />
    </>
  );
}
