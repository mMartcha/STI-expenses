import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import type { Expense } from '@/domain/entities/Expense';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type ExpenseCategory, type PaymentMethod } from '@/domain/entities/ExpenseCategory';
import { DateField } from '@/presentation/components/DateField';
import { Button, ChipSelect, TextField } from '@/presentation/components/ui';
import { useExpense, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { centsToInput, parseMoneyInput } from '@/presentation/utils/format';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: expense } = useExpense(id);
  if (!expense) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;
  return <EditExpenseForm expense={expense} />;
}

function EditExpenseForm({ expense }: { expense: Expense }) {
  const { t } = useTranslation();
  const { updateExpenseDetailsUseCase } = useDependencies();
  const showError = useErrorAlert();
  const mutation = useUseCaseMutation(updateExpenseDetailsUseCase.execute.bind(updateExpenseDetailsUseCase));

  const [description, setDescription] = useState(expense.description);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(expense.paymentMethod);
  const [occurredAt, setOccurredAt] = useState(new Date(expense.occurredAt));
  const [merchantName, setMerchantName] = useState(expense.merchant?.name ?? '');
  const [merchantTaxId, setMerchantTaxId] = useState(expense.merchant?.taxId ?? '');
  const [discount, setDiscount] = useState(expense.discount.isZero() ? '' : centsToInput(expense.discount.amount));
  const [notes, setNotes] = useState(expense.notes ?? '');
  const [discountError, setDiscountError] = useState<string | null>(null);

  const submit = () => {
    const discountCents = discount.trim() ? parseMoneyInput(discount) : 0;
    if (discountCents === null) return setDiscountError(t('errors.invalidAmount'));
    setDiscountError(null);

    // Mantém o horário original ao trocar só o dia.
    const original = new Date(expense.occurredAt);
    const date = new Date(occurredAt);
    date.setHours(original.getHours(), original.getMinutes(), original.getSeconds());

    mutation.mutate(
      {
        expenseId: expense.id,
        patch: {
          description,
          category,
          paymentMethod,
          occurredAt: date.toISOString(),
          merchantName: merchantName || null,
          merchantTaxId: merchantTaxId || null,
          discount: discountCents,
          notes: notes || null,
        },
      },
      { onSuccess: () => router.back(), onError: showError },
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <TextField label={t('expenses.fields.description')} value={description} onChangeText={setDescription} maxLength={200} />
        <ChipSelect
          label={t('expenses.fields.category')}
          value={category}
          onChange={setCategory}
          options={EXPENSE_CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`) }))}
        />
        <DateField label={t('expenses.fields.occurredAt')} value={occurredAt} maximumDate={new Date()} onChange={setOccurredAt} />
        <ChipSelect
          label={t('expenses.fields.paymentMethod')}
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={PAYMENT_METHODS.map((value) => ({ value, label: t(`paymentMethods.${value}`) }))}
        />
        <TextField label={t('expenses.fields.merchantName')} value={merchantName} onChangeText={setMerchantName} maxLength={200} />
        <TextField
          label={t('expenses.fields.merchantTaxId')}
          value={merchantTaxId}
          onChangeText={setMerchantTaxId}
          keyboardType="number-pad"
          maxLength={18}
        />
        <TextField
          label={t('expenses.fields.discount')}
          value={discount}
          onChangeText={setDiscount}
          keyboardType="decimal-pad"
          placeholder="0,00"
          error={discountError}
        />
        <TextField
          label={t('expenses.fields.notes')}
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
