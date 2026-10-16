import { NotFoundError } from '@/core/errors';
import type { Clock, IdGenerator } from '@/core/ports';

import type { ExpenseReport } from '../../entities/ExpenseReport';
import type { Session } from '../../entities/User';
import type { SyncScheduler } from '../../gateways/SyncScheduler';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import type { SyncQueue } from '../../repositories/SyncQueue';
import { assertOwner, requireSession } from '../shared';

export interface ReportDeps {
  reports: ReportRepository;
  expenses: ExpenseRepository;
  queue: SyncQueue;
  scheduler: SyncScheduler;
  sessions: SessionRepository;
  clock: Clock;
  ids: IdGenerator;
}

export async function loadOwnedReport(
  deps: Pick<ReportDeps, 'reports' | 'sessions'>,
  reportId: string,
): Promise<{ report: ExpenseReport; session: Session }> {
  const session = requireSession(deps.sessions);
  const report = await deps.reports.findById(reportId);
  if (!report) throw new NotFoundError('ExpenseReport', reportId);
  assertOwner(report, session.user.id);
  return { report, session };
}
