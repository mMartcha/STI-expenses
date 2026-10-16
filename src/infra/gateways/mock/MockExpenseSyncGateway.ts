import type { Expense } from '@/domain/entities/Expense';
import type { ExpenseReport } from '@/domain/entities/ExpenseReport';
import type { ExpenseSyncGateway, ReportDecision } from '@/domain/gateways/ExpenseSyncGateway';

import { expenseToDto, reportToDto } from '../../http/dto';
import { latency } from './delay';

export interface MockSyncOptions {
  /** Tempo até o "gestor" aprovar um relatório enviado. `null` = nunca aprova. */
  autoApproveAfterMs?: number | null;
}

/**
 * Servidor de despesas em memória. Simula a aprovação do gestor (que acontecerá no
 * app web) aprovando automaticamente os relatórios após um intervalo configurável.
 */
export class MockExpenseSyncGateway implements ExpenseSyncGateway {
  private readonly expenses = new Map<string, ReturnType<typeof expenseToDto>>();
  private readonly reports = new Map<string, ReturnType<typeof reportToDto>>();
  private readonly submittedAt = new Map<string, number>();

  constructor(private readonly options: MockSyncOptions = { autoApproveAfterMs: 2 * 60_000 }) {}

  async upsertExpense(expense: Expense): Promise<void> {
    await latency();
    this.expenses.set(expense.id, expenseToDto(expense));
  }

  async deleteExpense(expenseId: string): Promise<void> {
    await latency();
    this.expenses.delete(expenseId);
  }

  async upsertReport(report: ExpenseReport): Promise<void> {
    await latency();
    this.reports.set(report.id, reportToDto(report));
  }

  async deleteReport(reportId: string): Promise<void> {
    await latency();
    this.reports.delete(reportId);
  }

  async submitReport(report: ExpenseReport, expenses: readonly Expense[]): Promise<void> {
    await latency(600, 1200);
    this.reports.set(report.id, reportToDto(report));
    expenses.forEach((expense) => this.expenses.set(expense.id, expenseToDto(expense)));
    if (!this.submittedAt.has(report.id)) this.submittedAt.set(report.id, Date.now());
  }

  async fetchDecisions(reportIds: readonly string[]): Promise<ReportDecision[]> {
    await latency();
    const approveAfter = this.options.autoApproveAfterMs;
    return reportIds.map((reportId) => {
      // Servidor em memória perde o estado ao reiniciar o app: reinicia a contagem.
      if (!this.submittedAt.has(reportId)) this.submittedAt.set(reportId, Date.now());
      const submitted = this.submittedAt.get(reportId);
      const approved = approveAfter !== null && approveAfter !== undefined && submitted !== undefined && Date.now() - submitted >= approveAfter;
      return {
        reportId,
        status: approved ? 'APPROVED' : 'SUBMITTED',
        decidedAt: approved ? new Date().toISOString() : null,
        decidedBy: approved ? 'gestor.mock' : null,
        note: null,
      };
    });
  }
}
