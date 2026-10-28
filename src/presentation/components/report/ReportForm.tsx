import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { toDateKey } from '@/domain/shared/dates';

import { useReportDetailsForm } from '../../hooks/useReportDetailsForm';
import { useStyles } from '../../theme/theme';
import type { ReportFormProps } from '../../types/component.types';
import { parseDateValue } from '../../utils/format';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { ReportDetailsFields } from './ReportDetailsFields';
import { createStyles } from './styles';

/** Editar os dados do relatório: campos comuns + período (início/fim). */
export function ReportForm({ initial, submitLabel, loading, onSubmit }: ReportFormProps) {
  const { t } = useTranslation();
  const styles = useStyles(createStyles);
  const form = useReportDetailsForm(initial);
  const today = toDateKey(new Date());
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? today);

  const submit = () => {
    const details = form.validate();
    if (!details) return;
    onSubmit({ ...details, startDate, endDate: endDate < startDate ? startDate : endDate });
  };

  return (
    <View style={styles.form}>
      <ReportDetailsFields form={form}>
        <DateField label={t('expenses.fields.startDate')} value={parseDateValue(startDate)} onChange={(date) => setStartDate(toDateKey(date))} />
        <DateField
          label={t('expenses.fields.endDate')}
          value={parseDateValue(endDate)}
          minimumDate={parseDateValue(startDate)}
          onChange={(date) => setEndDate(toDateKey(date))}
        />
      </ReportDetailsFields>
      <Button title={submitLabel} loading={loading} onPress={submit} />
    </View>
  );
}
