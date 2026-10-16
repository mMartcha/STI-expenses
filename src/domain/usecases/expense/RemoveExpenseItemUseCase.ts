import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import { ExpenseMutation } from './ExpenseMutation';

export interface RemoveExpenseItemInput {
  expenseId: string;
  itemId: string;
  reason?: string | null;
}

/** Tira um item da nota do valor reembolsável (ex.: bebida alcoólica) e recalcula o total. */
export class RemoveExpenseItemUseCase extends ExpenseMutation implements UseCase<RemoveExpenseItemInput, Expense> {
  execute({ expenseId, itemId, reason = null }: RemoveExpenseItemInput): Promise<Expense> {
    return this.mutate(expenseId, (expense, ctx) => expense.removeItem(itemId, reason, ctx));
  }
}
