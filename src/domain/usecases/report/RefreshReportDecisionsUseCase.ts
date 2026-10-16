import { createChangeContext, type Clock, type IdGenerator } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { ExpenseSyncGateway } from '../../gateways/ExpenseSyncGateway';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import { SYSTEM_ACTOR } from '../shared';

/**
 * Busca no servidor a decisão do gestor para os relatórios enviados.
 * Aprovado → relatório e despesas ficam bloqueados para edição.
 * Retorna quantos relatórios mudaram de status.
 */
export class RefreshReportDecisionsUseCase implements UseCase<void, number> {
  constructor(
    private readonly reports: ReportRepository,
    private readonly expenses: ExpenseRepository,
    private readonly gateway: ExpenseSyncGateway,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(): Promise<number> {
    const session = this.sessions.current();
    if (!session) return 0;

    const submitted = await this.reports.listByOwner(session.user.id, ['SUBMITTED']);
    if (submitted.length === 0) return 0;

    const decisions = await this.gateway.fetchDecisions(submitted.map((report) => report.id));
    const ctx = createChangeContext(SYSTEM_ACTOR.sync, this.clock, this.ids);
    let changed = 0;

    for (const decision of decisions) {
      if (decision.status === 'SUBMITTED') continue;
      const report = submitted.find((candidate) => candidate.id === decision.reportId);
      if (!report) continue;

      const decided = report.applyDecision(
        {
          status: decision.status,
          decidedAt: decision.decidedAt ?? ctx.now.toISOString(),
          decidedBy: decision.decidedBy ?? SYSTEM_ACTOR.sync,
          note: decision.note,
        },
        ctx,
      );
      await this.reports.save(decided);

      if (decided.status === 'APPROVED') {
        const expenses = await this.expenses.listByReport(report.id);
        await this.expenses.saveMany(expenses.map((expense) => expense.lock()));
      }
      changed += 1;
    }
    return changed;
  }
}
