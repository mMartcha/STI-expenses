import { Image } from 'expo-image';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Expense, ExpenseItem } from '@/domain/entities/Expense';
import { isPdf } from '@/domain/gateways/ReceiptStorage';
import { Icon } from '@/presentation/components/Icon';
import { ReasonDialog } from '@/presentation/components/ReasonDialog';
import { AppText, Button, Card, Divider, Notice, Pill, Row, SectionTitle } from '@/presentation/components/ui';
import { useExpense, useReportDetails, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDateTime, formatMoney, formatQuantity } from '@/presentation/utils/format';
import { openReceiptDocument } from '@/presentation/utils/openReceipt';
import { REPORT_STATUS_TONE } from '@/presentation/utils/status';

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

  if (isLoading || !expense) {
    return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  }

  const report = reportDetails?.report ?? null;
  const editable = !expense.locked && (report?.isEditable ?? true);
  const title = expense.description || expense.merchant?.name || t('expenses.untitled');

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
              <Link href={{ pathname: '/expense/[id]/edit', params: { id: expense.id } }} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={t('common.edit')} hitSlop={12}>
                  <Icon name="edit" color={colors.primaryText} />
                </Pressable>
              </Link>
            ) : null,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 64 }}>
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
            {expense.receipt && isPdf(expense.receipt.mimeType) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('expenses.openPdf')}
                onPress={() => openReceiptDocument(expense.receipt!).catch(showError)}
                style={[styles.receipt, styles.pdf, { backgroundColor: colors.primarySurface }]}>
                <Icon name="pdf" size={28} color={colors.primaryText} />
                <AppText variant="caption" tone="brand">
                  PDF
                </AppText>
              </Pressable>
            ) : expense.receipt ? (
              <Link href={{ pathname: '/expense/[id]/receipt', params: { id: expense.id } }} asChild>
                <Pressable accessibilityRole="imagebutton" accessibilityLabel={t('expenses.viewReceipt')} style={[styles.receipt, { backgroundColor: colors.surfaceMuted }]}>
                  <Image source={{ uri: expense.receipt.localUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                </Pressable>
              </Link>
            ) : null}
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="heading">{title}</AppText>
              {expense.merchant?.taxId ? (
                <AppText variant="caption" tone="secondary">
                  {t('expenses.fields.merchantTaxId')}: {expense.merchant.taxId}
                </AppText>
              ) : null}
              <AppText variant="caption" tone="secondary">
                {formatDateTime(expense.occurredAt)}
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
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
              <Link href={{ pathname: '/expense/[id]/item', params: { id: expense.id } }} asChild>
                <Pressable accessibilityRole="button" hitSlop={8} style={styles.inlineAction}>
                  <Icon name="add" color={colors.primaryText} size={16} />
                  <AppText variant="label" tone="brand">
                    {t('expenses.addItem')}
                  </AppText>
                </Pressable>
              </Link>
            ) : null
          }
        />
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {expense.activeItems.length === 0 ? (
            <AppText tone="secondary" style={{ paddingVertical: 12 }}>
              —
            </AppText>
          ) : null}
          {expense.activeItems.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <Divider /> : null}
              <ItemRow
                expense={expense}
                item={item}
                editable={editable}
                busy={removeItem.isPending}
                onRemove={() => setRemoving(item)}
              />
            </View>
          ))}
        </Card>

        {expense.removedItems.length > 0 ? (
          <>
            <SectionTitle title={t('expenses.removedItems')} />
            <Card style={{ gap: 0, paddingVertical: 4, backgroundColor: colors.surfaceMuted }}>
              {expense.removedItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <Divider /> : null}
                  <ItemRow
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
            <Row
              label={t('expenses.excluded')}
              value={`− ${formatMoney(expense.excludedAmount.amount, expense.currency)}`}
              valueColor={colors.warning}
            />
          ) : null}
          <Divider />
          <Row label={t('common.total')} value={formatMoney(expense.total.amount, expense.currency)} strong valueColor={colors.primaryText} />
        </Card>

        {/* Relatório */}
        <SectionTitle title={t('expenses.fields.reportId')} />
        <Card>
          {report ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <AppText variant="heading" style={{ flex: 1 }} numberOfLines={1}>
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
        {editable ? (
          <Button title={t('common.delete')} variant="danger" icon="delete" loading={deleteExpense.isPending} onPress={confirmDelete} />
        ) : null}
      </ScrollView>

      <ReasonDialog
        visible={removing !== null}
        title={t('expenses.removeReasonTitle')}
        message={t('expenses.removeReasonMessage')}
        placeholder={t('expenses.removeReasonPlaceholder')}
        confirmLabel={t('expenses.removeItem')}
        onCancel={() => setRemoving(null)}
        onConfirm={(reason) => {
          if (removing) {
            removeItem.mutate({ expenseId: expense.id, itemId: removing.id, reason: reason || null }, { onError: showError });
          }
          setRemoving(null);
        }}
      />
    </>
  );
}

function ItemRow({
  expense,
  item,
  editable,
  busy,
  onRemove,
  onRestore,
}: {
  expense: Expense;
  item: ExpenseItem;
  editable: boolean;
  busy: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const removed = item.status === 'REMOVED';

  const content = (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText style={removed ? { textDecorationLine: 'line-through', color: colors.textTertiary } : undefined}>
        {item.description}
      </AppText>
      <AppText variant="caption" tone="secondary">
        {formatQuantity(item.quantity)} × {formatMoney(item.unitPrice.amount, expense.currency)}
      </AppText>
      {removed && item.removalReason ? (
        <AppText variant="caption" tone="tertiary">
          {t('expenses.removedReason', { reason: item.removalReason })}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View style={styles.item}>
      {editable && !removed ? (
        <Link href={{ pathname: '/expense/[id]/item', params: { id: expense.id, itemId: item.id } }} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={`${t('expenses.editItem')}: ${item.description}`} style={{ flex: 1 }}>
            {content}
          </Pressable>
        </Link>
      ) : (
        content
      )}
      <AppText
        style={[{ fontVariant: ['tabular-nums'] }, removed && { textDecorationLine: 'line-through', color: colors.textTertiary }]}>
        {formatMoney(item.total.amount, expense.currency)}
      </AppText>
      {editable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removed ? t('expenses.restoreItem') : t('expenses.removeItem')}
          disabled={busy}
          onPress={removed ? onRestore : onRemove}
          hitSlop={10}
          style={styles.itemAction}>
          <Icon name={removed ? 'undo' : 'delete'} size={18} color={removed ? colors.primary : colors.error} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12 },
  receipt: { width: 72, height: 96, borderRadius: 10, overflow: 'hidden' },
  pdf: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemAction: { padding: 4 },
});
