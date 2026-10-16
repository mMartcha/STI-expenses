import { ValidationError } from '@/core/errors';
import { createChangeContext } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { ExpenseReport } from '../../entities/ExpenseReport';
import { loadOwnedReport, type ReportDeps } from './ReportDeps';

/**
 * Envia o relatório para aprovação do gestor. Offline, o envio fica na fila e é feito
 * automaticamente quando a conexão voltar (aguardando também as leituras de OCR pendentes).
 */
export class SubmitReportUseCase implements UseCase<{ reportId: string }, ExpenseReport> {
  constructor(private readonly deps: ReportDeps) {}

  async execute({ reportId }: { reportId: string }): Promise<ExpenseReport> {
    const { reports, expenses, queue, scheduler, clock, ids } = this.deps;
    const { report, session } = await loadOwnedReport(this.deps, reportId);
    const reportExpenses = await expenses.listByReport(report.id);

    const incomplete = reportExpenses.filter((expense) => expense.ocrStatus === 'FAILED' && expense.items.length === 0);
    if (incomplete.length > 0) {
      throw new ValidationError('expenses', 'Há despesas sem valor: preencha-as manualmente', {
        count: incomplete.length,
      });
    }

    const submitted = report.submit(reportExpenses.length, createChangeContext(session.user.id, clock, ids));
    await reports.save(submitted);
    await queue.enqueue({ type: 'REPORT_SUBMIT', entityId: submitted.id });
    scheduler.request();
    return submitted;
  }
}
