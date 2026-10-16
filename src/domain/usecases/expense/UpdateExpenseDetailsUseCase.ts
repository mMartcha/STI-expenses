import type { UseCase } from '@/core/UseCase';

import type { DetailsPatch, Expense } from '../../entities/Expense';
import { ExpenseMutation } from './ExpenseMutation';

export interface UpdateExpenseDetailsInput {
  expenseId: string;
  patch: DetailsPatch;
}

export class UpdateExpenseDetailsUseCase
  extends ExpenseMutation
  implements UseCase<UpdateExpenseDetailsInput, Expense>
{
  execute({ expenseId, patch }: UpdateExpenseDetailsInput): Promise<Expense> {
    return this.mutate(expenseId, (expense, ctx) => expense.updateDetails(patch, ctx));
  }
}
