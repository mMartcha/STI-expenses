import { DomainError, NotFoundError } from '@/core/errors';
import { createChangeContext } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import { assertOwner } from '../shared';
import { loadOwnedReport, type ReportDeps } from './ReportDeps';

export interface DetachExpenseInput {
  reportId: string;
  expenseId: string;
}

/** Tira a despesa do relatório; ela volta a ser avulsa. */
export class DetachExpenseFromReportUseCase implements UseCase<DetachExpenseInput, void> {
  constructor(private readonly deps: ReportDeps) {}

  async execute({ reportId, expenseId }: DetachExpenseInput): Promise<void> {
    const { reports, expenses, queue, scheduler, clock, ids } = this.deps;
    const { report, session } = await loadOwnedReport(this.deps, reportId);
    report.assertEditable();

    const expense = await expenses.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense', expenseId);
    assertOwner(expense, session.user.id);
    if (expense.reportId !== report.id) {
      throw new DomainError('INVALID_STATE', 'A despesa não pertence a este relatório');
    }

    const ctx = createChangeContext(session.user.id, clock, ids);
    await expenses.save(expense.detachFromReport(ctx));
    await reports.save(report.recordExpense('REPORT_EXPENSE_REMOVED', expense.id, ctx));
    await queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });
    await queue.enqueue({ type: 'REPORT_UPSERT', entityId: report.id });
    scheduler.request();
  }
}
