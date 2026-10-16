import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import type { ReportDetailsInput } from '@/domain/entities/ExpenseReport';
import { toDateKey } from '@/domain/shared/dates';

import { centsToInput, parseDateValue, parseMoneyInput } from '../utils/format';
import { DateField } from './DateField';
import { Button, TextField } from './ui';

const formSchema = z.object({
  title: z.string().trim().min(1, 'required').max(120),
  purpose: z.string().trim().max(500),
  costCenter: z.string().trim().max(40),
  advance: z.string().refine((value) => value.trim() === '' || parseMoneyInput(value) !== null, 'invalidAmount'),
});

type FormErrors = Partial<Record<keyof z.infer<typeof formSchema>, string>>;

export function ReportForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
}: {
  initial?: Partial<ReportDetailsInput>;
  submitLabel: string;
  loading: boolean;
  onSubmit: (input: ReportDetailsInput) => void;
}) {
  const { t } = useTranslation();
  const today = toDateKey(new Date());

  const [title, setTitle] = useState(initial?.title ?? '');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');
  const [costCenter, setCostCenter] = useState(initial?.costCenter ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? today);
  const [advance, setAdvance] = useState(initial?.advance ? centsToInput(initial.advance) : '');
  const [errors, setErrors] = useState<FormErrors>({});

  const submit = () => {
    const parsed = formSchema.safeParse({ title, purpose, costCenter, advance });
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof FormErrors] = t(`errors.${issue.message as 'required'}`, {
          defaultValue: t('errors.required'),
        });
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit({
      title: parsed.data.title,
      purpose: parsed.data.purpose || null,
      costCenter: parsed.data.costCenter || null,
      startDate,
      endDate: endDate < startDate ? startDate : endDate,
      advance: parseMoneyInput(advance),
    });
  };

  return (
    <View style={{ gap: 16 }}>
      <TextField label={t('expenses.fields.title')} value={title} onChangeText={setTitle} error={errors.title} maxLength={120} />
      <TextField
        label={`${t('expenses.fields.purpose')} (${t('common.optional')})`}
        value={purpose}
        onChangeText={setPurpose}
        multiline
        maxLength={500}
        style={{ minHeight: 72, paddingTop: 12 }}
      />
      <DateField
        label={t('expenses.fields.startDate')}
        value={parseDateValue(startDate)}
        onChange={(date) => setStartDate(toDateKey(date))}
      />
      <DateField
        label={t('expenses.fields.endDate')}
        value={parseDateValue(endDate)}
        minimumDate={parseDateValue(startDate)}
        onChange={(date) => setEndDate(toDateKey(date))}
      />
      <TextField
        label={`${t('expenses.fields.costCenter')} (${t('common.optional')})`}
        value={costCenter}
        onChangeText={setCostCenter}
        maxLength={40}
        autoCapitalize="characters"
      />
      <TextField
        label={`${t('expenses.fields.advance')} (${t('common.optional')})`}
        value={advance}
        onChangeText={setAdvance}
        keyboardType="decimal-pad"
        placeholder="0,00"
        error={errors.advance}
      />
      <Button title={submitLabel} loading={loading} onPress={submit} />
    </View>
  );
}
