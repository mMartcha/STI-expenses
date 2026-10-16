import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import { ExpenseMutation } from './ExpenseMutation';

/** Tenta ler a nota novamente após uma falha do OCR. */
export class RetryOcrUseCase extends ExpenseMutation implements UseCase<{ expenseId: string }, Expense> {
  async execute({ expenseId }: { expenseId: string }): Promise<Expense> {
    const expense = await this.mutate(expenseId, (current, ctx) => current.requestOcrRetry(ctx));
    await this.deps.queue.enqueue({ type: 'RECEIPT_OCR', entityId: expense.id });
    this.deps.scheduler.request();
    return expense;
  }
}
