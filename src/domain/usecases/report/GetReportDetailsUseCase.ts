import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import type { ExpenseReport } from '../../entities/ExpenseReport';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import { ReportSummaryCalculator, type ReportSummary } from '../../services/ReportSummaryCalculator';
import { loadOwnedReport } from './ReportDeps';

export interface ReportDetails {
  report: ExpenseReport;
  expenses: Expense[];
  summary: ReportSummary;
}

/** Relatório consolidado: despesas agrupadas por dia, totais por categoria e saldo do adiantamento. */
export class GetReportDetailsUseCase implements UseCase<{ reportId: string }, ReportDetails> {
  private readonly calculator = new ReportSummaryCalculator();

  constructor(
    private readonly reports: ReportRepository,
    private readonly expenses: ExpenseRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async execute({ reportId }: { reportId: string }): Promise<ReportDetails> {
    const { report } = await loadOwnedReport({ reports: this.reports, sessions: this.sessions }, reportId);
    const expenses = await this.expenses.listByReport(report.id);
    return { report, expenses, summary: this.calculator.calculate(report, expenses) };
  }
}
