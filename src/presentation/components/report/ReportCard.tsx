import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useStyles, useTheme } from '../../theme/theme';
import type { ReportCardProps } from '../../types/component.types';
import { formatDate, formatMoney } from '../../utils/format';
import { REPORT_STATUS_TONE } from '../../utils/status';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { Pill } from '../Pill';
import { createStyles } from './styles';

/**
 * Um relatório em lista: título, período, status e (na aba Relatórios) quantidade e total.
 * Mesma peça na aba Relatórios e na escolha de relatório ao mover uma despesa.
 */
export function ReportCard({ report, summary, onPress, disabled }: ReportCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const period = t('reports.period', { start: formatDate(report.startDate), end: formatDate(report.endDate) });

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: pressed ? colors.surfaceMuted : colors.surface }]}>
      <View style={styles.body}>
        <AppText variant="heading" numberOfLines={1}>
          {report.title}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {summary ? `${period} · ${t('reports.expensesCount', { count: summary.expenseCount })}` : period}
        </AppText>
        <View style={styles.pills}>
          <Pill tone={REPORT_STATUS_TONE[report.status]} label={t(`reports.status.${report.status}`)} />
          {report.syncStatus === 'FAILED' ? <Pill tone="error" label={t('sync.status.FAILED')} /> : null}
        </View>
      </View>
      <View style={styles.trailing}>
        {summary ? (
          <AppText variant="heading" style={styles.tabular}>
            {formatMoney(summary.total.amount, summary.total.currency)}
          </AppText>
        ) : null}
        <Icon name="chevronRight" color={colors.textTertiary} size={16} />
      </View>
    </Pressable>
  );
}
