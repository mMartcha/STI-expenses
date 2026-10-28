import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type ExpenseCategory, type PaymentMethod } from '@/domain/entities/ExpenseCategory';

import { useUseCaseMutation } from '../../hooks/queries';
import { useErrorToast } from '../../hooks/useAsyncAction';
import { useDependencies } from '../../providers/DependenciesProvider';
import type { ManualExpenseFormProps } from '../../types/component.types';
import { parseMoneyInput } from '../../utils/format';
import { CATEGORY_ICON, PAYMENT_METHOD_ICON } from '../../utils/status';
import { Button } from '../Button';
import { DateField } from '../DateField';
import { FormScreen } from '../FormScreen';
import { SelectField } from '../SelectField';
import { TextField } from '../TextField';

const formSchema = z.object({
  description: z.string().trim().min(1, 'required').max(200),
  amount: z.string().refine((value) => (parseMoneyInput(value) ?? 0) > 0, 'invalidAmount'),
});

/**
 * Despesa sem comprovante (ex.: táxi sem recibo). Usado na rota `/expense/new` e na aba
 * "Manual" da tela de criar despesa. Opcionalmente já cria dentro de um relatório.
 */
export function ManualExpenseForm({ reportId, onSaved }: ManualExpenseFormProps) {
  const { t } = useTranslation();
  const { createManualExpenseUseCase } = useDependencies();
  const showError = useErrorToast();
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
    // CTA fixo no rodapé: sempre visível, mesmo com o formulário rolado.
    <FormScreen footer={<Button title={t('expenses.createOne')} loading={mutation.isPending} onPress={submit} />}>
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
      <SelectField
        label={t('expenses.fields.category')}
        value={category}
        onChange={setCategory}
        options={EXPENSE_CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`), icon: CATEGORY_ICON[value] }))}
      />
      <DateField label={t('expenses.fields.occurredAt')} value={occurredAt} maximumDate={new Date()} onChange={setOccurredAt} />
      <SelectField
        label={`${t('expenses.fields.paymentMethod')} (${t('common.optional')})`}
        value={paymentMethod}
        onChange={setPaymentMethod}
        onClear={() => setPaymentMethod(null)}
        options={PAYMENT_METHODS.map((value) => ({ value, label: t(`paymentMethods.${value}`), icon: PAYMENT_METHOD_ICON[value] }))}
      />
      <TextField
        label={`${t('expenses.fields.notes')} (${t('common.optional')})`}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={1000}
      />
    </FormScreen>
  );
}
