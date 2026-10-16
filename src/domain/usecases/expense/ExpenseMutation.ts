import { DomainError, NotFoundError } from '@/core/errors';
import { createChangeContext, type ChangeContext, type Clock, type IdGenerator } from '@/core/ports';

import type { Expense } from '../../entities/Expense';
import type { SyncScheduler } from '../../gateways/SyncScheduler';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import type { SyncQueue } from '../../repositories/SyncQueue';
import { assertOwner, requireSession } from '../shared';

export interface ExpenseMutationDeps {
  expenses: ExpenseRepository;
  reports: ReportRepository;
  queue: SyncQueue;
  scheduler: SyncScheduler;
  sessions: SessionRepository;
  clock: Clock;
  ids: IdGenerator;
}

/**
 * Fluxo comum a toda edição de despesa: carrega, valida dono e bloqueio do relatório,
 * aplica a regra de domínio, persiste e coloca na fila de sincronização.
 */
export abstract class ExpenseMutation {
  constructor(protected readonly deps: ExpenseMutationDeps) {}

  protected async mutate(expenseId: string, apply: (expense: Expense, ctx: ChangeContext) => Expense): Promise<Expense> {
    const session = requireSession(this.deps.sessions);
    const expense = await this.deps.expenses.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense', expenseId);
    assertOwner(expense, session.user.id);
    await this.assertReportEditable(expense);

    const ctx = createChangeContext(session.user.id, this.deps.clock, this.deps.ids);
    const updated = apply(expense, ctx);
    if (updated === expense) return expense;

    await this.deps.expenses.save(updated);
    await this.deps.queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: updated.id });
    this.deps.scheduler.request();
    return updated;
  }

  private async assertReportEditable(expense: Expense): Promise<void> {
    if (!expense.reportId) return;
    const report = await this.deps.reports.findById(expense.reportId);
    if (report && !report.isEditable) {
      throw new DomainError('LOCKED', 'O relatório desta despesa não pode mais ser alterado');
    }
  }
}
