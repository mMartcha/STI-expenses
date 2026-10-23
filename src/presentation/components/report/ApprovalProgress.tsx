import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useStyles, useTheme } from '../../theme/theme';
import type { ApprovalProgressProps } from '../../types/component.types';
import { formatDateTime, formatMoney } from '../../utils/format';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { Pill } from '../Pill';
import { createApprovalStyles } from './styles';

type StepState = 'done' | 'current' | 'next';

/**
 * Relatório enviado e aguardando o gestor, mostrado dentro de Pendências na Início:
 * valor, quantidade e em que etapa está (Enviado → Em análise → Aprovado).
 * Não pede ação do usuário, então não acende o ponto de pendência.
 */
export function ApprovalProgress({ item, onPress }: ApprovalProgressProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createApprovalStyles);
  const { report, total, expenseCount } = item;
  const steps: { label: string; state: StepState }[] = [
    { label: t('home.approval.stepSent'), state: 'done' },
    { label: t('home.approval.stepReview'), state: 'current' },
    { label: t('home.approval.stepApproved'), state: 'next' },
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('home.approval.a11y', { title: report.title, total: formatMoney(total.amount, total.currency) })}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && { backgroundColor: colors.surfaceMuted }]}>
      <View style={styles.header}>
        <Pill tone="info" icon="history" label={t('home.approval.badge')} />
        {report.submittedAt ? (
          <AppText variant="caption" tone="secondary">
            {t('home.approval.sentAt', { date: formatDateTime(report.submittedAt) })}
          </AppText>
        ) : null}
      </View>

      <AppText variant="heading" numberOfLines={2}>
        {report.title}
      </AppText>
      <View style={styles.amountRow}>
        <AppText variant="title" style={styles.tabular}>
          {formatMoney(total.amount, total.currency)}
        </AppText>
        <AppText variant="caption" tone="secondary">
          {t('reports.expensesCount', { count: expenseCount })}
        </AppText>
      </View>

      <View style={styles.steps} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {steps.map((step, index) => (
          <View key={step.label} style={styles.stepGroup}>
            {index > 0 ? <View style={[styles.line, step.state !== 'next' && styles.lineDone]} /> : null}
            <View style={styles.step}>
              <View style={[styles.circle, styles[step.state]]}>
                {step.state === 'done' ? <Icon name="check" size={14} color={colors.background} /> : null}
                {step.state === 'current' ? <View style={styles.currentDot} /> : null}
              </View>
              <AppText
                variant="caption"
                style={[styles.stepLabel, { color: step.state === 'current' ? colors.info : step.state === 'done' ? colors.textPrimary : colors.textSecondary }]}>
                {step.label}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <AppText variant="caption" tone="secondary">
        {t('home.approval.hint')}
      </AppText>
    </Pressable>
  );
}
