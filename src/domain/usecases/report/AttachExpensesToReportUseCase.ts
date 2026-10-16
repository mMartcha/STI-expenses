import { NotFoundError } from '@/core/errors';
import { createChangeContext } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import { assertOwner } from '../shared';
import { loadOwnedReport, type ReportDeps } from './ReportDeps';

export interface AttachExpensesInput {
  reportId: string;
  expenseIds: string[];
}

/** Junta despesas avulsas (ex.: as de uma semana ou de uma viagem) em um relatório. */
export class AttachExpensesToReportUseCase implements UseCase<AttachExpensesInput, void> {
  constructor(private readonly deps: ReportDeps) {}

  async execute({ reportId, expenseIds }: AttachExpensesInput): Promise<void> {
    const { reports, expenses, queue, scheduler, clock, ids } = this.deps;
    const { report, session } = await loadOwnedReport(this.deps, reportId);
    report.assertEditable();

    const ctx = createChangeContext(session.user.id, clock, ids);
    let updatedReport = report;
    const updatedExpenses: Expense[] = [];

    for (const expenseId of new Set(expenseIds)) {
      const expense = await expenses.findById(expenseId);
      if (!expense) throw new NotFoundError('Expense', expenseId);
      assertOwner(expense, session.user.id);
      if (expense.reportId === report.id) continue;

      updatedExpenses.push(expense.attachToReport(report.id, ctx));
      updatedReport = updatedReport.recordExpense('REPORT_EXPENSE_ADDED', expense.id, ctx);
    }
    if (updatedExpenses.length === 0) return;

    await expenses.saveMany(updatedExpenses);
    await reports.save(updatedReport);
    for (const expense of updatedExpenses) {
      await queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });
    }
    await queue.enqueue({ type: 'REPORT_UPSERT', entityId: report.id });
    scheduler.request();
  }
}
