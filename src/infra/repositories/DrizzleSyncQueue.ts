import { and, asc, count, eq, lte, sql } from 'drizzle-orm';

import type { Clock, IdGenerator } from '@/core/ports';
import type { SyncOperation, SyncOperationType, SyncQueue } from '@/domain/repositories/SyncQueue';

import type { Database } from '../database/client';
import { syncOperations } from '../database/schema';

/** Operações em que só o estado mais recente importa: várias edições viram um único envio. */
const DEDUPLICATED: ReadonlySet<SyncOperationType> = new Set([
  'RECEIPT_OCR',
  'EXPENSE_UPSERT',
  'REPORT_UPSERT',
  'REPORT_SUBMIT',
]);

export class DrizzleSyncQueue implements SyncQueue {
  constructor(
    private readonly db: Database,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async enqueue(op: { type: SyncOperationType; entityId: string }): Promise<void> {
    const now = this.clock.now().toISOString();
    const dedupeKey = DEDUPLICATED.has(op.type) ? `${op.type}:${op.entityId}` : null;

    this.db
      .insert(syncOperations)
      .values({
        id: this.ids.next(),
        type: op.type,
        entityId: op.entityId,
        attempts: 0,
        revision: 0,
        nextAttemptAt: now,
        lastError: null,
        status: 'PENDING',
        createdAt: now,
        dedupeKey,
      })
      // Já existe na fila: mantém posição e id (idempotência), mas reativa para envio imediato.
      .onConflictDoUpdate({
        target: syncOperations.dedupeKey,
        set: {
          status: 'PENDING',
          nextAttemptAt: now,
          attempts: 0,
          revision: sql`${syncOperations.revision} + 1`,
        },
      })
      .run();
  }

  async listDue(now: Date, limit: number): Promise<SyncOperation[]> {
    return this.db
      .select()
      .from(syncOperations)
      .where(and(eq(syncOperations.status, 'PENDING'), lte(syncOperations.nextAttemptAt, now.toISOString())))
      .orderBy(asc(syncOperations.createdAt))
      .limit(limit)
      .all()
      .map((row) => ({
        id: row.id,
        type: row.type as SyncOperationType,
        entityId: row.entityId,
        attempts: row.attempts,
        revision: row.revision,
        nextAttemptAt: row.nextAttemptAt,
        lastError: row.lastError,
        status: row.status as SyncOperation['status'],
        createdAt: row.createdAt,
      }));
  }

  async complete(op: SyncOperation): Promise<void> {
    this.db
      .delete(syncOperations)
      .where(and(eq(syncOperations.id, op.id), eq(syncOperations.revision, op.revision)))
      .run();
  }

  async removeForEntity(entityId: string): Promise<void> {
    this.db.delete(syncOperations).where(eq(syncOperations.entityId, entityId)).run();
  }

  async reschedule(
    id: string,
    update: { attempts: number; nextAttemptAt: string; lastError: string | null; dead: boolean },
  ): Promise<void> {
    this.db
      .update(syncOperations)
      .set({
        attempts: update.attempts,
        nextAttemptAt: update.nextAttemptAt,
        lastError: update.lastError,
        status: update.dead ? 'DEAD' : 'PENDING',
      })
      .where(eq(syncOperations.id, id))
      .run();
  }

  async countPending(): Promise<number> {
    return this.countByStatus('PENDING');
  }

  async countDead(): Promise<number> {
    return this.countByStatus('DEAD');
  }

  async reviveDead(now: Date): Promise<void> {
    this.db
      .update(syncOperations)
      .set({ status: 'PENDING', attempts: 0, nextAttemptAt: now.toISOString() })
      .where(eq(syncOperations.status, 'DEAD'))
      .run();
  }

  private countByStatus(status: 'PENDING' | 'DEAD'): number {
    const row = this.db.select({ value: count() }).from(syncOperations).where(eq(syncOperations.status, status)).get();
    return row?.value ?? 0;
  }
}
