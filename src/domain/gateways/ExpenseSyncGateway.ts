import type { Expense } from '../entities/Expense';
import type { ExpenseReport } from '../entities/ExpenseReport';

export interface ReportDecision {
  reportId: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  decidedAt: string | null;
  decidedBy: string | null;
  note: string | null;
}

/** API de despesas. Todas as escritas recebem chave de idempotência (retentativas seguras). */
export interface ExpenseSyncGateway {
  upsertExpense(expense: Expense, idempotencyKey: string): Promise<void>;
  deleteExpense(expenseId: string, idempotencyKey: string): Promise<void>;
  upsertReport(report: ExpenseReport, idempotencyKey: string): Promise<void>;
  deleteReport(reportId: string, idempotencyKey: string): Promise<void>;
  /** Envia o relatório consolidado, com todas as despesas, para aprovação do gestor. */
  submitReport(report: ExpenseReport, expenses: readonly Expense[], idempotencyKey: string): Promise<void>;
  fetchDecisions(reportIds: readonly string[]): Promise<ReportDecision[]>;
}
