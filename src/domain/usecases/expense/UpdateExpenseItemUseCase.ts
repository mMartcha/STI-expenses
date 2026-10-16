import type { UseCase } from '@/core/UseCase';

import type { Expense, ItemPatch } from '../../entities/Expense';
import { ExpenseMutation } from './ExpenseMutation';

export interface UpdateExpenseItemInput {
  expenseId: string;
  itemId: string;
  patch: ItemPatch;
}

/** Corrige um item lido errado pelo OCR; o total é recalculado e a mudança vai para o histórico. */
export class UpdateExpenseItemUseCase extends ExpenseMutation implements UseCase<UpdateExpenseItemInput, Expense> {
  execute({ expenseId, itemId, patch }: UpdateExpenseItemInput): Promise<Expense> {
    return this.mutate(expenseId, (expense, ctx) => expense.updateItem(itemId, patch, ctx));
  }
}
