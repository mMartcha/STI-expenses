import { NotFoundError } from '@/core/errors';
import { createChangeContext, type Clock, type IdGenerator } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import { Expense } from '../../entities/Expense';
import type { ExpenseCategory, PaymentMethod } from '../../entities/ExpenseCategory';
import type { SyncScheduler } from '../../gateways/SyncScheduler';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import type { SyncQueue } from '../../repositories/SyncQueue';
import { DEFAULT_CURRENCY } from '../../shared/Money';
import { assertOwner, requireSession } from '../shared';

export interface CreateManualExpenseInput {
  description: string;
  /** Em centavos. */
  amount: number;
  category: ExpenseCategory;
  occurredAt: string;
  paymentMethod?: PaymentMethod | null;
  merchantName?: string | null;
  notes?: string | null;
  /** Já cria dentro de um relatório (opcional). */
  reportId?: string | null;
}

/** Despesa sem nota (ex.: táxi sem recibo). */
export class CreateManualExpenseUseCase implements UseCase<CreateManualExpenseInput, Expense> {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly reports: ReportRepository,
    private readonly queue: SyncQueue,
    private readonly scheduler: SyncScheduler,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CreateManualExpenseInput): Promise<Expense> {
    const session = requireSession(this.sessions);
    const ctx = createChangeContext(session.user.id, this.clock, this.ids);

    let expense = Expense.createManual({ ...input, ownerId: session.user.id, currency: DEFAULT_CURRENCY }, ctx);

    if (input.reportId) {
      const report = await this.reports.findById(input.reportId);
      if (!report) throw new NotFoundError('ExpenseReport', input.reportId);
      assertOwner(report, session.user.id);
      const updatedReport = report.recordExpense('REPORT_EXPENSE_ADDED', expense.id, ctx);
      expense = expense.attachToReport(report.id, ctx);
      await this.expenses.save(expense);
      await this.reports.save(updatedReport);
      await this.queue.enqueue({ type: 'REPORT_UPSERT', entityId: report.id });
    } else {
      await this.expenses.save(expense);
    }

    await this.queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });
    this.scheduler.request();
    return expense;
  }
}
