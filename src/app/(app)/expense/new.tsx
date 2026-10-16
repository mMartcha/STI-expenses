import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { z } from 'zod';

import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type ExpenseCategory, type PaymentMethod } from '@/domain/entities/ExpenseCategory';
import { DateField } from '@/presentation/components/DateField';
import { Button, ChipSelect, TextField } from '@/presentation/components/ui';
import { useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { parseMoneyInput } from '@/presentation/utils/format';

const formSchema = z.object({
  description: z.string().trim().min(1, 'required').max(200),
  amount: z.string().refine((value) => (parseMoneyInput(value) ?? 0) > 0, 'invalidAmount'),
});

/** Despesa sem nota (ex.: táxi sem recibo). Opcionalmente já dentro de um relatório. */
export default function NewManualExpenseScreen() {
  const { t } = useTranslation();
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  const { createManualExpenseUseCase } = useDependencies();
  const showError = useErrorAlert();
  const mutation = useUseCaseMutation(createManualExpenseUseCase.execute.bind(createManualExpenseUseCase));

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('MEAL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [occurredAt, setOccurredAt] = useState(new Date());
  const [merchantName, setMerchantName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});

  const submit = () => {
    const parsed = formSchema.safeParse({ description, amount });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        next[issue.path[0] as keyof typeof errors] = t(`errors.${issue.message as 'required' | 'invalidAmount'}`);
      }
      return setErrors(next);
    }
    setErrors({});
    mutation.mutate(
      {
        description: parsed.data.description,
        amount: parseMoneyInput(amount)!,
        category,
        paymentMethod,
        occurredAt: occurredAt.toISOString(),
        merchantName: merchantName || null,
        notes: notes || null,
        reportId: reportId ?? null,
      },
      { onSuccess: () => router.back(), onError: showError },
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <TextField
          label={t('expenses.fields.description')}
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          maxLength={200}
          placeholder="Ex.: Táxi aeroporto → hotel"
        />
        <TextField
          label={t('expenses.fields.amount')}
          value={amount}
          onChangeText={setAmount}
          error={errors.amount}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />
        <ChipSelect
          label={t('expenses.fields.category')}
          value={category}
          onChange={setCategory}
          options={EXPENSE_CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`) }))}
        />
        <DateField label={t('expenses.fields.occurredAt')} value={occurredAt} maximumDate={new Date()} onChange={setOccurredAt} />
        <ChipSelect
          label={`${t('expenses.fields.paymentMethod')} (${t('common.optional')})`}
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={PAYMENT_METHODS.map((value) => ({ value, label: t(`paymentMethods.${value}`) }))}
        />
        <TextField
          label={`${t('expenses.fields.merchantName')} (${t('common.optional')})`}
          value={merchantName}
          onChangeText={setMerchantName}
          maxLength={200}
        />
        <TextField
          label={`${t('expenses.fields.notes')} (${t('common.optional')})`}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={1000}
          style={{ minHeight: 72, paddingTop: 12 }}
        />
        <Button title={t('common.save')} loading={mutation.isPending} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
