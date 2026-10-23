import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useStyles, useTheme } from '../../theme/theme';
import type { ExpenseItemRowProps } from '../../types/component.types';
import { formatMoney, formatQuantity } from '../../utils/format';
import { AppText } from '../AppText';
import { IconButton } from '../IconButton';
import { createStyles } from './styles';

/** Item da nota: descrição, quantidade × preço, total e ação de remover/restaurar. */
export function ExpenseItemRow({ expense, item, editable, busy, onRemove, onRestore }: ExpenseItemRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const removed = item.status === 'REMOVED';

  const content = (
    <View style={styles.itemBody}>
      <AppText style={removed ? styles.struck : undefined}>{item.description}</AppText>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('expenses.editItem')}: ${item.description}`}
          onPress={() => router.push({ pathname: '/expense/[id]/item', params: { id: expense.id, itemId: item.id } })}
          style={styles.itemBody}>
          {content}
        </Pressable>
      ) : (
        content
      )}
      <AppText style={[styles.tabular, removed && styles.struck]}>{formatMoney(item.total.amount, expense.currency)}</AppText>
      {editable ? (
        <IconButton
          icon={removed ? 'undo' : 'delete'}
          accessibilityLabel={removed ? t('expenses.restoreItem') : t('expenses.removeItem')}
          size={36}
          iconSize={18}
          color={removed ? colors.primaryText : colors.error}
          disabled={busy}
          onPress={removed ? onRestore : onRemove}
        />
      ) : null}
    </View>
  );
}
