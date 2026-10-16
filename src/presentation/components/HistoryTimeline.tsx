import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { AuditEntry, AuditValue, FieldChange } from '@/domain/entities/AuditEntry';
import { MONEY_AUDIT_FIELDS } from '@/domain/entities/Expense';
import { SYSTEM_ACTOR } from '@/domain/usecases/shared';
import type { CurrencyCode } from '@/domain/shared/Money';

import { useSessionStore } from '../stores/sessionStore';
import { useTheme } from '../theme/theme';
import { formatDate, formatDateTime, formatMoney } from '../utils/format';
import { AppText, Pill } from './ui';

/**
 * Linha do tempo de auditoria: é o que o gestor verá para entender cada alteração
 * (valor lido pelo OCR → valor corrigido, itens removidos e motivo).
 */
export function HistoryTimeline({
  entries,
  currency,
  describeTarget,
  submittedAt,
}: {
  entries: readonly AuditEntry[];
  currency: CurrencyCode;
  describeTarget?: (targetId: string) => string | null;
  /** Destaca o que mudou depois do envio para aprovação. */
  submittedAt?: string | null;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const userId = useSessionStore((state) => state.user?.id);

  if (entries.length === 0) {
    return <AppText tone="secondary">{t('history.empty')}</AppText>;
  }

  const actorLabel = (actorId: string) => {
    if (actorId === userId) return t('history.actors.you');
    if (actorId === SYSTEM_ACTOR.ocr) return t('history.actors.ocr');
    if (actorId === SYSTEM_ACTOR.sync) return t('history.actors.sync');
    return actorId;
  };

  const formatValue = (change: FieldChange, value: AuditValue): string => {
    if (value === null || value === '') return '—';
    if (MONEY_AUDIT_FIELDS.has(change.field) && typeof value === 'number') return formatMoney(value, currency);
    if (change.field === 'category') return t(`categories.${value as 'MEAL'}`);
    if (change.field === 'paymentMethod') return t(`paymentMethods.${value as 'PIX'}`);
    if (change.field === 'status') return t(`reports.status.${value as 'DRAFT'}`);
    if (change.field === 'occurredAt' || change.field === 'startDate' || change.field === 'endDate') {
      return formatDate(String(value));
    }
    return String(value);
  };

  return (
    <View style={styles.list}>
      {[...entries].reverse().map((entry) => {
        const target = entry.targetId && describeTarget ? describeTarget(entry.targetId) : null;
        const afterSubmit = submittedAt && entry.at > submittedAt && entry.action !== 'REPORT_SUBMITTED';
        return (
          <View key={entry.id} style={styles.entry}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={[styles.content, { borderLeftColor: colors.border }]}>
              <AppText variant="heading">
                {t(`history.actions.${entry.action}`)}
                {target ? `: ${target}` : ''}
              </AppText>
              <AppText variant="caption" tone="secondary">
                {formatDateTime(entry.at)} · {t('history.by', { actor: actorLabel(entry.actorId) })}
              </AppText>
              {afterSubmit ? <Pill tone="warning" label={t('reports.editedAfterSubmit')} /> : null}
              {entry.changes.map((change, index) => (
                <AppText key={`${change.field}-${index}`} variant="caption">
                  {t(`expenses.fields.${change.field}` as 'expenses.fields.total', { defaultValue: change.field })}:{' '}
                  <AppText variant="caption" tone="tertiary" style={{ textDecorationLine: 'line-through' }}>
                    {formatValue(change, change.from)}
                  </AppText>{' '}
                  → {formatValue(change, change.to)}
                </AppText>
              ))}
              {entry.reason === 'MANUAL_DATA_KEPT' ? (
                <AppText variant="caption" tone="secondary">
                  {t('history.manualDataKept')}
                </AppText>
              ) : entry.reason && entry.reason !== 'MANUAL' && entry.reason !== 'RECEIPT' ? (
                <AppText variant="caption" tone="secondary">
                  {t('history.reason', { reason: entry.reason })}
                </AppText>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  entry: { flexDirection: 'row' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginRight: -5, zIndex: 1 },
  content: { flex: 1, gap: 4, paddingLeft: 16, paddingBottom: 20, borderLeftWidth: 1 },
});
