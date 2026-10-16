import type { UseCase } from '@/core/UseCase';

import type { ExpenseReport, ReportStatus } from '../../entities/ExpenseReport';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import { Money } from '../../shared/Money';
import { requireSession } from '../shared';

export interface ReportListItem {
  report: ExpenseReport;
  total: Money;
  expenseCount: number;
}

export class ListReportsUseCase implements UseCase<{ statuses?: ReportStatus[] }, ReportListItem[]> {
  constructor(
    private readonly reports: ReportRepository,
    private readonly expenses: ExpenseRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async execute(input: { statuses?: ReportStatus[] } = {}): Promise<ReportListItem[]> {
    const session = requireSession(this.sessions);
    const reports = await this.reports.listByOwner(session.user.id, input.statuses);

    return Promise.all(
      reports.map(async (report) => {
        const expenses = await this.expenses.listByReport(report.id);
        return {
          report,
          total: Money.sum(expenses.map((expense) => expense.total), report.currency),
          expenseCount: expenses.length,
        };
      }),
    );
  }
}
