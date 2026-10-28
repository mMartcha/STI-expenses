import { useTranslation } from 'react-i18next';

import type { ReportDetailsFieldsProps } from '../../types/component.types';
import { TextField } from '../TextField';

/**
 * Campos comuns do relatório, na ordem: título, motivo e `children` (o período de cada tela).
 * O estado vem de `useReportDetailsForm`; centro de custo e adiantamento estão ocultos.
 */
export function ReportDetailsFields({ form, children }: ReportDetailsFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <TextField label={t('expenses.fields.title')} value={form.title} onChangeText={form.setTitle} error={form.errors.title} maxLength={120} />
      <TextField
        label={`${t('expenses.fields.purpose')} (${t('common.optional')})`}
        value={form.purpose}
        onChangeText={form.setPurpose}
        multiline
        maxLength={500}
      />
      {children}
      {/* Centro de custo oculto a pedido do negócio; para reativar, descomente e exponha `setCostCenter` em `useReportDetailsForm`.
      <TextField
        label={`${t('expenses.fields.costCenter')} (${t('common.optional')})`}
        value={form.costCenter}
        onChangeText={form.setCostCenter}
        maxLength={40}
        autoCapitalize="characters"
      />
      */}
      {/* Adiantamento oculto por ora; o valor existente é preservado. Para reativar, descomente.
      <TextField
        label={`${t('expenses.fields.advance')} (${t('common.optional')})`}
        value={form.advance}
        onChangeText={form.setAdvance}
        keyboardType="decimal-pad"
        placeholder="0,00"
        error={form.errors.advance}
      />
      */}
    </>
  );
}
