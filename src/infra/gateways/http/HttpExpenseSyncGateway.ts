import type { Expense } from '@/domain/entities/Expense';
import type { ExpenseReport } from '@/domain/entities/ExpenseReport';
import type { ExpenseSyncGateway, ReportDecision } from '@/domain/gateways/ExpenseSyncGateway';

import type { HttpClient } from '../../http/HttpClient';
import { decisionsDto, expenseToDto, reportToDto } from '../../http/dto';

const id = encodeURIComponent;

export class HttpExpenseSyncGateway implements ExpenseSyncGateway {
  constructor(private readonly http: HttpClient) {}

  async upsertExpense(expense: Expense, idempotencyKey: string): Promise<void> {
    await this.http.request(`/expenses/${id(expense.id)}`, { method: 'PUT', body: expenseToDto(expense), idempotencyKey });
  }

  async deleteExpense(expenseId: string, idempotencyKey: string): Promise<void> {
    await this.http.request(`/expenses/${id(expenseId)}`, { method: 'DELETE', idempotencyKey }).catch(ignoreNotFound);
  }

  async upsertReport(report: ExpenseReport, idempotencyKey: string): Promise<void> {
    await this.http.request(`/reports/${id(report.id)}`, { method: 'PUT', body: reportToDto(report), idempotencyKey });
  }

  async deleteReport(reportId: string, idempotencyKey: string): Promise<void> {
    await this.http.request(`/reports/${id(reportId)}`, { method: 'DELETE', idempotencyKey }).catch(ignoreNotFound);
  }

  async submitReport(report: ExpenseReport, expenses: readonly Expense[], idempotencyKey: string): Promise<void> {
    await this.http.request(`/reports/${id(report.id)}/submit`, {
      method: 'POST',
      body: { report: reportToDto(report), expenses: expenses.map(expenseToDto) },
      idempotencyKey,
    });
  }

  fetchDecisions(reportIds: readonly string[]): Promise<ReportDecision[]> {
    const query = reportIds.map((reportId) => `ids=${id(reportId)}`).join('&');
    return this.http.request(`/reports/decisions?${query}`, { schema: decisionsDto });
  }
}

/** Excluir algo que já não existe no servidor é sucesso (idempotência). */
function ignoreNotFound(error: unknown): void {
  if (error && typeof error === 'object' && 'status' in error && error.status === 404) return;
  throw error;
}
