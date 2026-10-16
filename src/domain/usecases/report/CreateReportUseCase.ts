import { createChangeContext } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import { ExpenseReport, type ReportDetailsInput } from '../../entities/ExpenseReport';
import { DEFAULT_CURRENCY } from '../../shared/Money';
import { requireSession } from '../shared';
import type { ReportDeps } from './ReportDeps';

/** Cria um relatório (ex.: uma viagem de 4 dias) que vai agrupar várias despesas. */
export class CreateReportUseCase implements UseCase<ReportDetailsInput, ExpenseReport> {
  constructor(private readonly deps: ReportDeps) {}

  async execute(input: ReportDetailsInput): Promise<ExpenseReport> {
    const { reports, queue, scheduler, sessions, clock, ids } = this.deps;
    const session = requireSession(sessions);
    const report = ExpenseReport.create(
      { ...input, ownerId: session.user.id, currency: DEFAULT_CURRENCY },
      createChangeContext(session.user.id, clock, ids),
    );
    await reports.save(report);
    await queue.enqueue({ type: 'REPORT_UPSERT', entityId: report.id });
    scheduler.request();
    return report;
  }
}
