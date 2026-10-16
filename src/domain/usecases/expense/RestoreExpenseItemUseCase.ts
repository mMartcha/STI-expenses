import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import { ExpenseMutation } from './ExpenseMutation';

export interface RestoreExpenseItemInput {
  expenseId: string;
  itemId: string;
}

/** Desfaz a remoção de um item. */
export class RestoreExpenseItemUseCase extends ExpenseMutation implements UseCase<RestoreExpenseItemInput, Expense> {
  execute({ expenseId, itemId }: RestoreExpenseItemInput): Promise<Expense> {
    return this.mutate(expenseId, (expense, ctx) => expense.restoreItem(itemId, ctx));
  }
}
