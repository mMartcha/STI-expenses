import type { UseCase } from '@/core/UseCase';

import type { Expense, NewItemInput } from '../../entities/Expense';
import { ExpenseMutation } from './ExpenseMutation';

export interface AddExpenseItemInput {
  expenseId: string;
  item: NewItemInput;
}

export class AddExpenseItemUseCase extends ExpenseMutation implements UseCase<AddExpenseItemInput, Expense> {
  execute({ expenseId, item }: AddExpenseItemInput): Promise<Expense> {
    return this.mutate(expenseId, (expense, ctx) => expense.addItem(item, ctx));
  }
}
