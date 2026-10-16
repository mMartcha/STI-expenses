import { DomainError, NotFoundError } from '@/core/errors';
import { createChangeContext } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { ReceiptStorage } from '../../gateways/ReceiptStorage';
import { assertOwner, requireSession } from '../shared';
import { ExpenseMutation, type ExpenseMutationDeps } from './ExpenseMutation';

export class DeleteExpenseUseCase extends ExpenseMutation implements UseCase<{ expenseId: string }, void> {
  constructor(
    deps: ExpenseMutationDeps,
    private readonly receipts: ReceiptStorage,
  ) {
    super(deps);
  }

  async execute({ expenseId }: { expenseId: string }): Promise<void> {
    const { expenses, reports, queue, scheduler, sessions, clock, ids } = this.deps;
    const session = requireSession(sessions);
    const expense = await expenses.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense', expenseId);
    assertOwner(expense, session.user.id);
    if (expense.locked) throw new DomainError('LOCKED', 'Despesa de relatório aprovado não pode ser excluída');

    if (expense.reportId) {
      const report = await reports.findById(expense.reportId);
      if (report) {
        // Fica registrado no relatório (o gestor verá que a despesa saiu); lança LOCKED se aprovado.
        const ctx = createChangeContext(session.user.id, clock, ids);
        await reports.save(report.recordExpense('REPORT_EXPENSE_REMOVED', expense.id, ctx));
        await queue.enqueue({ type: 'REPORT_UPSERT', entityId: report.id });
      }
    }

    await expenses.delete(expense.id);
    await queue.removeForEntity(expense.id);
    await queue.enqueue({ type: 'EXPENSE_DELETE', entityId: expense.id });
    if (expense.receipt) await this.receipts.remove(expense.receipt.localUri);
    scheduler.request();
  }
}
