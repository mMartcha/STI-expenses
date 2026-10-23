import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Expense, ExpenseItem } from '@/domain/entities/Expense';
import { Button, FormScreen, LoadingState, Row, TextField } from '@/presentation/components';
import { useExpense, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { centsToInput, formatMoney, parseMoneyInput, parseQuantityInput } from '@/presentation/utils/format';

/** Adicionar item (sem `itemId`) ou corrigir um item lido pelo OCR (com `itemId`). */
export default function ItemScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId?: string }>();
  const { data: expense } = useExpense(id);
  if (!expense) return <LoadingState />;
  const item = itemId ? (expense.items.find((candidate) => candidate.id === itemId) ?? null) : null;
  return <ItemForm expense={expense} item={item} />;
}

function ItemForm({ expense, item }: { expense: Expense; item: ExpenseItem | null }) {
  const { t } = useTranslation();
  const deps = useDependencies();
  const showError = useErrorAlert();
  const add = useUseCaseMutation(deps.addExpenseItemUseCase.execute.bind(deps.addExpenseItemUseCase));
  const update = useUseCaseMutation(deps.updateExpenseItemUseCase.execute.bind(deps.updateExpenseItemUseCase));

  const [description, setDescription] = useState(item?.description ?? '');
  const [quantity, setQuantity] = useState(item ? String(item.quantity).replace('.', ',') : '1');
  const [unitPrice, setUnitPrice] = useState(item ? centsToInput(item.unitPrice.amount) : '');
  const [total, setTotal] = useState(item ? centsToInput(item.total.amount) : '');
  const [totalEdited, setTotalEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const qty = parseQuantityInput(quantity);
  const price = parseMoneyInput(unitPrice);
  const preview = totalEdited ? parseMoneyInput(total) : qty !== null && price !== null ? Math.round(qty * price) : null;

  const submit = () => {
    const next: Record<string, string> = {};
    if (!description.trim()) next.description = t('errors.required');
    if (qty === null) next.quantity = t('errors.invalidAmount');
    if (price === null) next.unitPrice = t('errors.invalidAmount');
    if (totalEdited && parseMoneyInput(total) === null) next.total = t('errors.invalidAmount');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const values = {
      description,
      quantity: qty!,
      unitPrice: price!,
      total: totalEdited ? parseMoneyInput(total)! : undefined,
    };
    const options = { onSuccess: () => router.back(), onError: showError };

    if (item) update.mutate({ expenseId: expense.id, itemId: item.id, patch: values }, options);
    else add.mutate({ expenseId: expense.id, item: values }, options);
  };

  return (
    <FormScreen>
      <Stack.Screen options={{ title: item ? t('expenses.editItem') : t('expenses.addItem') }} />
      <TextField
        label={t('expenses.fields.description')}
        value={description}
        onChangeText={setDescription}
        error={errors.description}
        maxLength={200}
      />
      <TextField
        label={t('expenses.fields.quantity')}
        value={quantity}
        onChangeText={setQuantity}
        error={errors.quantity}
        keyboardType="decimal-pad"
      />
      <TextField
        label={t('expenses.fields.unitPrice')}
        value={unitPrice}
        onChangeText={setUnitPrice}
        error={errors.unitPrice}
        keyboardType="decimal-pad"
        placeholder="0,00"
      />
      <TextField
        label={`${t('expenses.fields.total')} (${t('common.optional')})`}
        value={totalEdited ? total : ''}
        onChangeText={(value) => {
          setTotal(value);
          setTotalEdited(value.trim() !== '');
        }}
        error={errors.total}
        hint={t('expenses.totalAutoHint')}
        keyboardType="decimal-pad"
        placeholder={preview !== null ? centsToInput(preview) : '0,00'}
      />
      {preview !== null ? <Row label={t('common.total')} value={formatMoney(preview, expense.currency)} strong /> : null}
      <Button title={t('common.save')} loading={add.isPending || update.isPending} onPress={submit} />
    </FormScreen>
  );
}
