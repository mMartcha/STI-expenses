import type { Clock } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { Notice, NoticeFeed } from '../../entities/Notice';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { PreferencesRepository } from '../../repositories/PreferencesRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import type { SyncQueue } from '../../repositories/SyncQueue';
import { requireSession } from '../shared';

export function noticesSeenKey(userId: string): string {
  return `notices.lastSeenAt.${userId}`;
}

/** Monta os avisos do sino a partir do estado local (decisões, OCR e sincronização). */
export class ListNoticesUseCase implements UseCase<void, NoticeFeed> {
  constructor(
    private readonly reports: ReportRepository,
    private readonly expenses: ExpenseRepository,
    private readonly queue: SyncQueue,
    private readonly preferences: PreferencesRepository,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<NoticeFeed> {
    const session = requireSession(this.sessions);
    const userId = session.user.id;
    const lastSeenAt = (await this.preferences.get(noticesSeenKey(userId))) ?? '';

    const [decided, ocrFailed, deadOps] = await Promise.all([
      this.reports.listByOwner(userId, ['APPROVED', 'REJECTED']),
      this.expenses.list({ ownerId: userId, ocrFailedOnly: true }),
      this.queue.countDead(),
    ]);

    const notices: Notice[] = [];

    if (deadOps > 0) {
      notices.push({
        id: 'sync-failed',
        type: 'SYNC_FAILED',
        targetId: null,
        targetLabel: String(deadOps),
        at: this.clock.now().toISOString(),
        unread: true,
        requiresAction: true,
      });
    }

    for (const expense of ocrFailed) {
      if (expense.items.length > 0 || expense.locked) continue; // já preenchida manualmente
      notices.push({
        id: `ocr-${expense.id}`,
        type: 'OCR_FAILED',
        targetId: expense.id,
        targetLabel: expense.description || null,
        at: expense.updatedAt,
        unread: expense.updatedAt > lastSeenAt,
        requiresAction: true,
      });
    }

    for (const report of decided) {
      const at = report.decidedAt ?? report.updatedAt;
      notices.push({
        id: `decision-${report.id}`,
        type: report.status === 'APPROVED' ? 'REPORT_APPROVED' : 'REPORT_REJECTED',
        targetId: report.id,
        targetLabel: report.title,
        at,
        unread: at > lastSeenAt,
        requiresAction: false,
      });
    }

    notices.sort((a, b) => b.at.localeCompare(a.at));
    return {
      notices,
      hasAttention: notices.some((notice) => notice.unread || notice.requiresAction),
    };
  }
}
