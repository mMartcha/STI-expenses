import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useStyles, useTheme } from '../../theme/theme';
import type { ExpenseSelectRowProps } from '../../types/component.types';
import { formatDateTime, formatMoney } from '../../utils/format';
import { AppText } from '../AppText';
import { Checkbox } from '../Checkbox';
import { createStyles } from './styles';

/** Despesa selecionável (seleção múltipla ao juntar despesas num relatório). */
export function ExpenseSelectRow({ expense, checked, onToggle, disabled, hint }: ExpenseSelectRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onToggle}
      style={[
        styles.selectRow,
        { backgroundColor: checked ? colors.primarySubtle : colors.surface, borderColor: checked ? colors.primary : colors.border },
        disabled && styles.selectRowDisabled,
      ]}>
      <Checkbox checked={checked} />
      <View style={styles.rowBody}>
        <AppText variant="heading" numberOfLines={1}>
          {expense.description || expense.merchant?.name || t('expenses.untitled')}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {t(`categories.${expense.category}`)} · {formatDateTime(expense.occurredAt)}
        </AppText>
        {hint ? (
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <AppText variant="heading" style={styles.tabular}>
        {formatMoney(expense.total.amount, expense.currency)}
      </AppText>
    </Pressable>
  );
}
