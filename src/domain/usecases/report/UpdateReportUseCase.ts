import { createChangeContext } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { ExpenseReport, ReportDetailsInput } from '../../entities/ExpenseReport';
import { loadOwnedReport, type ReportDeps } from './ReportDeps';

export interface UpdateReportInput {
  reportId: string;
  details: ReportDetailsInput;
}

export class UpdateReportUseCase implements UseCase<UpdateReportInput, ExpenseReport> {
  constructor(private readonly deps: ReportDeps) {}

  async execute({ reportId, details }: UpdateReportInput): Promise<ExpenseReport> {
    const { report, session } = await loadOwnedReport(this.deps, reportId);
    const updated = report.update(details, createChangeContext(session.user.id, this.deps.clock, this.deps.ids));
    if (updated === report) return report;

    await this.deps.reports.save(updated);
    await this.deps.queue.enqueue({ type: 'REPORT_UPSERT', entityId: updated.id });
    this.deps.scheduler.request();
    return updated;
  }
}
