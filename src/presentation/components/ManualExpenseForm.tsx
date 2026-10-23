import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import type { Expense } from '@/domain/entities/Expense';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type ExpenseCategory, type PaymentMethod } from '@/domain/entities/ExpenseCategory';

import { useUseCaseMutation } from '../hooks/queries';
import { useErrorAlert } from '../hooks/useAsyncAction';
import { useDependencies } from '../providers/DependenciesProvider';
import { parseMoneyInput } from '../utils/format';
import { DateField } from './DateField';
import { Button, ChipSelect, TextField } from './ui';

const formSchema = z.object({
  description: z.string().trim().min(1, 'required').max(200),
  amount: z.string().refine((value) => (parseMoneyInput(value) ?? 0) > 0, 'invalidAmount'),
});

/**
 * Despesa sem comprovante (ex.: táxi sem recibo). Usado na rota `/expense/new` e na aba
 * "Manual" da tela de criar despesa. Opcionalmente já cria dentro de um relatório.
 */
export function ManualExpenseForm({ reportId, onSaved }: { reportId?: string | null; onSaved: (expense: Expense) => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
      { onSuccess: onSaved, onError: showError },
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <TextField
          label={t('expenses.fields.amount')}
          value={amount}
          onChangeText={setAmount}
          error={errors.amount}
          keyboardType="decimal-pad"
          placeholder="R$ 0,00"
        />
        <TextField
          label={t('expenses.fields.description')}
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          maxLength={200}
          placeholder={t('expenses.descriptionPlaceholder')}
        />
        <TextField
          label={`${t('expenses.fields.merchantName')} (${t('common.optional')})`}
          value={merchantName}
          onChangeText={setMerchantName}
          maxLength={200}
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
          label={`${t('expenses.fields.notes')} (${t('common.optional')})`}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={1000}
          style={{ minHeight: 72, paddingTop: 12 }}
        />
      </ScrollView>
      {/* CTA fixo no rodapé: sempre visível, mesmo com o formulário rolado. */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 12 }}>
        <Button title={t('expenses.createOne')} loading={mutation.isPending} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}
