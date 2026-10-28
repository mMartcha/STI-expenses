import { router } from 'expo-router';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useStyles, useTheme } from '../../theme/theme';
import type { ExpenseRowProps } from '../../types/component.types';
import { formatMoney, formatTime } from '../../utils/format';
import { CATEGORY_ICON } from '../../utils/status';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { Pill } from '../Pill';
import { ReceiptThumbnail } from './ReceiptThumbnail';
import { createStyles } from './styles';

function ExpenseRowComponent({ expense, showDate = false }: ExpenseRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  // Enquanto a nota é lida, o próprio título mostra o andamento (os dados ainda não existem).
  const reading = expense.ocrStatus === 'PENDING' && expense.items.length === 0;
  const title = reading ? t('expenses.reading') : expense.description || expense.merchant?.name || t('expenses.untitled');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatMoney(expense.total.amount, expense.currency)}`}
      onPress={() => router.push({ pathname: '/expense/[id]', params: { id: expense.id } })}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface }]}>
      <ReceiptThumbnail receipt={expense.receipt} placeholderIcon={CATEGORY_ICON[expense.category]} />

      <View style={styles.rowBody}>
        <AppText variant="heading" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {t(`categories.${expense.category}`)} · {showDate ? new Date(expense.occurredAt).toLocaleDateString() : formatTime(expense.occurredAt)}
        </AppText>
        <View style={styles.pills}>
          {expense.ocrStatus === 'PENDING' && !reading ? <Pill tone="info" label={t('expenses.reading')} /> : null}
          {expense.ocrStatus === 'FAILED' && expense.items.length === 0 ? <Pill tone="warning" icon="warning" label={t('expenses.ocrFailed')} /> : null}
          {expense.locked ? <Pill tone="success" icon="lock" label={t('reports.status.APPROVED')} /> : null}
          {expense.syncStatus === 'FAILED' ? <Pill tone="error" label={t('sync.status.FAILED')} /> : null}
        </View>
      </View>

      <View style={styles.amount}>
        {reading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <AppText variant="heading" style={styles.tabular}>
            {formatMoney(expense.total.amount, expense.currency)}
          </AppText>
        )}
        {expense.syncStatus === 'PENDING' ? <Icon name="sync" size={12} color={colors.textTertiary} /> : null}
      </View>
    </Pressable>
  );
}

/** Uma despesa na lista: miniatura, título, categoria/hora, selos de estado e valor. */
export const ExpenseRow = memo(ExpenseRowComponent);
