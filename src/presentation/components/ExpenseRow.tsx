import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import type { Expense } from '@/domain/entities/Expense';
import { isPdf } from '@/domain/gateways/ReceiptStorage';

import { useTheme } from '../theme/theme';
import { formatMoney, formatTime } from '../utils/format';
import { Icon } from './Icon';
import { AppText, Pill } from './ui';

function ExpenseRowComponent({ expense, showDate = false }: { expense: Expense; showDate?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const title = expense.description || expense.merchant?.name || t('expenses.untitled');

  return (
    <Link href={{ pathname: '/expense/[id]', params: { id: expense.id } }} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${formatMoney(expense.total.amount, expense.currency)}`}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
        ]}>
        <View style={[styles.thumb, { backgroundColor: colors.primarySurface }]}>
          {expense.receipt && isPdf(expense.receipt.mimeType) ? (
            <Icon name="pdf" color={colors.primary} />
          ) : expense.receipt ? (
            <Image source={{ uri: expense.receipt.localUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Icon name="manual" color={colors.primary} />
          )}
        </View>

        <View style={styles.body}>
          <AppText variant="heading" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {t(`categories.${expense.category}`)} ·{' '}
            {showDate ? new Date(expense.occurredAt).toLocaleDateString() : formatTime(expense.occurredAt)}
          </AppText>
          <View style={styles.pills}>
            {expense.ocrStatus === 'PENDING' ? <Pill tone="info" label={t('expenses.reading')} /> : null}
            {expense.ocrStatus === 'FAILED' && expense.items.length === 0 ? (
              <Pill tone="warning" icon="warning" label={t('expenses.ocrFailed')} />
            ) : null}
            {expense.locked ? <Pill tone="success" icon="lock" label={t('reports.status.APPROVED')} /> : null}
            {expense.syncStatus === 'FAILED' ? <Pill tone="error" label={t('sync.status.FAILED')} /> : null}
          </View>
        </View>

        <View style={styles.amount}>
          {expense.ocrStatus === 'PENDING' && expense.items.length === 0 ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <AppText variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
              {formatMoney(expense.total.amount, expense.currency)}
            </AppText>
          )}
          {expense.syncStatus === 'PENDING' ? <Icon name="sync" size={12} color={colors.textTertiary} /> : null}
        </View>
      </Pressable>
    </Link>
  );
}

export const ExpenseRow = memo(ExpenseRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 48, height: 48, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  amount: { alignItems: 'flex-end', gap: 4 },
});
