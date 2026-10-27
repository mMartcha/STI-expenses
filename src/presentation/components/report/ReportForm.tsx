import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { z } from 'zod';

import { toDateKey } from '@/domain/shared/dates';

import { useStyles, useTheme } from '../../theme/theme';
import type { ReportDateMode, ReportFormProps } from '../../types/component.types';
import { centsToInput, formatDate, parseDateValue, parseMoneyInput } from '../../utils/format';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { Icon } from '../Icon';
import { SegmentedControl } from '../SegmentedControl';
import { TextField } from '../TextField';
import { createStyles } from './styles';

const formSchema = z.object({
  title: z.string().trim().min(1, 'required').max(120),
  purpose: z.string().trim().max(500),
  costCenter: z.string().trim().max(40),
  advance: z.string().refine((value) => value.trim() === '' || parseMoneyInput(value) !== null, 'invalidAmount'),
});

type FormErrors = Partial<Record<keyof z.infer<typeof formSchema> | 'days', string>>;

/**
 * Dados do relatório (título, período, adiantamento). Com `allowSpecificDays`, o período pode ser
 * um intervalo (26/10 – 29/10) ou dias avulsos (26/10 e 29/10); os dias escolhidos vão no 2º
 * argumento de `onSubmit` e o relatório fica com início/fim = primeiro/último dia.
 */
export function ReportForm({ initial, initialDays, submitLabel, loading, allowSpecificDays, onSubmit }: ReportFormProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const today = toDateKey(new Date());

  const [title, setTitle] = useState(initial?.title ?? '');
  const [purpose, setPurpose] = useState(initial?.purpose ?? '');
  // Campo de centro de custo oculto por ora (ver JSX abaixo); o valor existente é preservado.
  const [costCenter] = useState(initial?.costCenter ?? '');
  const [dateMode, setDateMode] = useState<ReportDateMode>(initialDays?.length ? 'days' : 'range');
  const [startDate, setStartDate] = useState(initial?.startDate ?? today);
  const [endDate, setEndDate] = useState(initial?.endDate ?? today);
  const [days, setDays] = useState<string[]>(initialDays?.length ? [...initialDays] : [today]);
  const [advance, setAdvance] = useState(initial?.advance ? centsToInput(initial.advance) : '');
  const [errors, setErrors] = useState<FormErrors>({});

  const addDay = (date: Date) => {
    const key = toDateKey(date);
    setDays((current) => (current.includes(key) ? current : [...current, key].sort()));
    setErrors((current) => ({ ...current, days: undefined }));
  };
  const removeDay = (key: string) => setDays((current) => current.filter((day) => day !== key));

  const submit = () => {
    const parsed = formSchema.safeParse({ title, purpose, costCenter, advance });
    const next: FormErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof FormErrors] = t(`errors.${issue.message as 'required'}`, {
          defaultValue: t('errors.required'),
        });
      }
    }
    const usingDays = allowSpecificDays && dateMode === 'days';
    if (usingDays && days.length === 0) next.days = t('reports.dates.daysRequired');
    if (!parsed.success || next.days) {
      setErrors(next);
      return;
    }
    setErrors({});
    const period = usingDays
      ? { startDate: days[0], endDate: days[days.length - 1] }
      : { startDate, endDate: endDate < startDate ? startDate : endDate };
    onSubmit(
      {
        title: parsed.data.title,
        purpose: parsed.data.purpose || null,
        costCenter: parsed.data.costCenter || null,
        ...period,
        advance: parseMoneyInput(advance),
      },
      usingDays ? days : null,
    );
  };

  return (
    <View style={styles.form}>
      <TextField label={t('expenses.fields.title')} value={title} onChangeText={setTitle} error={errors.title} maxLength={120} />
      <TextField
        label={`${t('expenses.fields.purpose')} (${t('common.optional')})`}
        value={purpose}
        onChangeText={setPurpose}
        multiline
        maxLength={500}
      />
      {allowSpecificDays ? (
        <SegmentedControl
          options={[
            { value: 'range', label: t('reports.dates.range'), icon: 'calendar' },
            { value: 'days', label: t('reports.dates.days'), icon: 'multiple' },
          ]}
          value={dateMode}
          onChange={setDateMode}
          size="sm"
        />
      ) : null}
      {allowSpecificDays && dateMode === 'days' ? (
        <View style={styles.days}>
          <DateField label={t('reports.dates.addDay')} value={parseDateValue(days[days.length - 1] ?? today)} onChange={addDay} />
          <View style={styles.dayChips}>
            {days.map((day) => (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={t('reports.dates.removeDay', { day: formatDate(day) })}
                onPress={() => removeDay(day)}
                style={[styles.dayChip, { backgroundColor: colors.primarySubtle, borderColor: colors.primary }]}>
                <AppText variant="label">{formatDate(day, { day: '2-digit', month: '2-digit' })}</AppText>
                <Icon name="close" size={14} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>
          {errors.days ? (
            <AppText variant="caption" color={colors.error}>
              {errors.days}
            </AppText>
          ) : (
            <AppText variant="caption" tone="secondary">
              {t('reports.dates.daysHint')}
            </AppText>
          )}
        </View>
      ) : (
        <>
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
        </>
      )}
      {/* Centro de custo oculto a pedido do negócio; para reativar, descomente e volte a usar `setCostCenter`.
      <TextField
        label={`${t('expenses.fields.costCenter')} (${t('common.optional')})`}
        value={costCenter}
        onChangeText={setCostCenter}
        maxLength={40}
        autoCapitalize="characters"
      />
      */}
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
