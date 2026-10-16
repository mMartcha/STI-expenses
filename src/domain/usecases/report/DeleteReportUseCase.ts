import { DomainError } from '@/core/errors';
import { createChangeContext } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import { loadOwnedReport, type ReportDeps } from './ReportDeps';

/** Exclui um relatório em rascunho. As despesas não são apagadas: voltam a ser avulsas. */
export class DeleteReportUseCase implements UseCase<{ reportId: string }, void> {
  constructor(private readonly deps: ReportDeps) {}

  async execute({ reportId }: { reportId: string }): Promise<void> {
    const { reports, expenses, queue, scheduler, clock, ids } = this.deps;
    const { report, session } = await loadOwnedReport(this.deps, reportId);
    if (!report.isDeletable) {
      throw new DomainError('INVALID_STATE', 'Somente relatórios em rascunho podem ser excluídos');
    }

    const ctx = createChangeContext(session.user.id, clock, ids);
    const detached = (await expenses.listByReport(report.id)).map((expense) => expense.detachFromReport(ctx));
    await expenses.saveMany(detached);
    await reports.delete(report.id);

    await queue.removeForEntity(report.id);
    for (const expense of detached) {
      await queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });
    }
    await queue.enqueue({ type: 'REPORT_DELETE', entityId: report.id });
    scheduler.request();
  }
}
