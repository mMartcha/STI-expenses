import type { ChangeContext, Clock, IdGenerator, Logger } from '@/core/ports';
import type { Expense } from '@/domain/entities/Expense';
import type { ExpenseReport, ReportStatus } from '@/domain/entities/ExpenseReport';
import type { OcrResult } from '@/domain/entities/OcrResult';
import type { Session } from '@/domain/entities/User';
import type { ExpenseSyncGateway, ReportDecision } from '@/domain/gateways/ExpenseSyncGateway';
import type { OcrGateway } from '@/domain/gateways/OcrGateway';
import type { ReceiptStorage } from '@/domain/gateways/ReceiptStorage';
import type { SyncScheduler } from '@/domain/gateways/SyncScheduler';
import type { ExpenseFilter, ExpenseRepository } from '@/domain/repositories/ExpenseRepository';
import type { ReportRepository } from '@/domain/repositories/ReportRepository';
import type { SessionRepository } from '@/domain/repositories/SessionRepository';
import type { SyncOperation, SyncOperationType, SyncQueue } from '@/domain/repositories/SyncQueue';

export class FixedClock implements Clock {
  constructor(public current = new Date('2026-10-15T12:00:00.000Z')) {}
  now(): Date {
    return new Date(this.current);
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class SequentialIds implements IdGenerator {
  private counter = 0;
  next(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }
}

export const nullLogger: Logger = { debug() {}, info() {}, warn() {}, error() {} };

export function ctx(actorId = 'user-1', clock = new FixedClock(), ids = new SequentialIds()): ChangeContext {
  return { actorId, now: clock.now(), newId: () => ids.next() };
}

export const USER = { id: 'user-1', name: 'Ana', email: 'ana@stara.com.br', role: 'EMPLOYEE' as const };

export class FakeSessionRepository implements SessionRepository {
  constructor(public session: Session | null = { user: USER, accessToken: 'a', refreshToken: 'r', expiresAt: '2099-01-01T00:00:00.000Z' }) {}
  async load() {
    return this.session;
  }
  current() {
    return this.session;
  }
  async save(session: Session) {
    this.session = session;
  }
  async clear() {
    this.session = null;
  }
}

export class InMemoryExpenseRepository implements ExpenseRepository {
  readonly items = new Map<string, Expense>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async list(filter: ExpenseFilter) {
    return [...this.items.values()].filter(
      (e) =>
        e.ownerId === filter.ownerId &&
        (!filter.from || e.occurredAt >= filter.from) &&
        (!filter.to || e.occurredAt <= filter.to) &&
        (!filter.unassignedOnly || !e.reportId) &&
        (!filter.ocrFailedOnly || e.ocrStatus === 'FAILED'),
    );
  }
  async listByReport(reportId: string) {
    return [...this.items.values()].filter((e) => e.reportId === reportId);
  }
  async save(expense: Expense) {
    this.items.set(expense.id, expense);
  }
  async saveMany(expenses: readonly Expense[]) {
    expenses.forEach((e) => this.items.set(e.id, e));
  }
  async delete(id: string) {
    this.items.delete(id);
  }
  async markSynced(id: string, version: number) {
    const current = this.items.get(id);
    if (current && current.version === version) this.items.set(id, current.markSynced());
  }
}

export class InMemoryReportRepository implements ReportRepository {
  readonly items = new Map<string, ExpenseReport>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async listByOwner(ownerId: string, statuses?: readonly ReportStatus[]) {
    return [...this.items.values()].filter((r) => r.ownerId === ownerId && (!statuses || statuses.includes(r.status)));
  }
  async save(report: ExpenseReport) {
    this.items.set(report.id, report);
  }
  async delete(id: string) {
    this.items.delete(id);
  }
  async markSynced(id: string, version: number) {
    const current = this.items.get(id);
    if (current && current.version === version) this.items.set(id, current.markSynced());
  }
}

const DEDUPED: SyncOperationType[] = ['RECEIPT_OCR', 'EXPENSE_UPSERT', 'REPORT_UPSERT', 'REPORT_SUBMIT'];

/** Mesma semântica do DrizzleSyncQueue (deduplicação + revisão). */
export class InMemorySyncQueue implements SyncQueue {
  ops: (SyncOperation & { dedupe: string | null })[] = [];
  private seq = 0;
  constructor(private readonly clock: FixedClock) {}

  async enqueue(op: { type: SyncOperationType; entityId: string }) {
    const now = this.clock.now().toISOString();
    const dedupe = DEDUPED.includes(op.type) ? `${op.type}:${op.entityId}` : null;
    const existing = dedupe ? this.ops.find((o) => o.dedupe === dedupe) : undefined;
    if (existing) {
      Object.assign(existing, { status: 'PENDING', nextAttemptAt: now, attempts: 0, revision: existing.revision + 1 });
      return;
    }
    this.seq += 1;
    this.ops.push({
      id: `op-${this.seq}`,
      type: op.type,
      entityId: op.entityId,
      attempts: 0,
      revision: 0,
      nextAttemptAt: now,
      lastError: null,
      status: 'PENDING',
      createdAt: `${now}#${String(this.seq).padStart(4, '0')}`,
      dedupe,
    });
  }
  async listDue(now: Date, limit: number) {
    return this.ops
      .filter((o) => o.status === 'PENDING' && o.nextAttemptAt <= now.toISOString())
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit)
      .map((o) => ({ ...o }));
  }
  async complete(op: SyncOperation) {
    this.ops = this.ops.filter((o) => !(o.id === op.id && o.revision === op.revision));
  }
  async removeForEntity(entityId: string) {
    this.ops = this.ops.filter((o) => o.entityId !== entityId);
  }
  async reschedule(id: string, u: { attempts: number; nextAttemptAt: string; lastError: string | null; dead: boolean }) {
    const op = this.ops.find((o) => o.id === id);
    if (op) Object.assign(op, { attempts: u.attempts, nextAttemptAt: u.nextAttemptAt, lastError: u.lastError, status: u.dead ? 'DEAD' : 'PENDING' });
  }
  async countPending() {
    return this.ops.filter((o) => o.status === 'PENDING').length;
  }
  async countDead() {
    return this.ops.filter((o) => o.status === 'DEAD').length;
  }
  async reviveDead(now: Date) {
    this.ops.filter((o) => o.status === 'DEAD').forEach((o) => Object.assign(o, { status: 'PENDING', attempts: 0, nextAttemptAt: now.toISOString() }));
  }
}

export class FakeScheduler implements SyncScheduler {
  requests = 0;
  request() {
    this.requests += 1;
  }
}

export class FakeReceiptStorage implements ReceiptStorage {
  removed: string[] = [];
  async persist(sourceUri: string, mimeType: string | null) {
    return { localUri: `file:///receipts/${sourceUri.split('/').pop()}`, mimeType: mimeType ?? 'image/jpeg' };
  }
  async persistBase64(_data: string, mimeType: string) {
    return { localUri: 'file:///receipts/pasted.png', mimeType };
  }
  async remove(localUri: string) {
    this.removed.push(localUri);
  }
  async clearAll() {}
}

export class FakeOcrGateway implements OcrGateway {
  uploads = 0;
  uploadError: Error | null = null;
  recognizeError: Error | null = null;
  constructor(public result: OcrResult = sampleOcr()) {}
  async uploadReceipt() {
    this.uploads += 1;
    if (this.uploadError) throw this.uploadError;
    return 'remote-receipt-1';
  }
  async recognize() {
    if (this.recognizeError) throw this.recognizeError;
    return this.result;
  }
}

export class FakeSyncGateway implements ExpenseSyncGateway {
  upserts: Expense[] = [];
  submitted: { report: ExpenseReport; expenses: readonly Expense[] }[] = [];
  decisions: ReportDecision[] = [];
  error: Error | null = null;
  /** Executado durante o envio (simula o usuário editando enquanto a rede trabalha). */
  duringUpsert: (() => Promise<void>) | null = null;

  async upsertExpense(expense: Expense) {
    if (this.error) throw this.error;
    await this.duringUpsert?.();
    this.upserts.push(expense);
  }
  async deleteExpense() {
    if (this.error) throw this.error;
  }
  async upsertReport() {
    if (this.error) throw this.error;
  }
  async deleteReport() {
    if (this.error) throw this.error;
  }
  async submitReport(report: ExpenseReport, expenses: readonly Expense[]) {
    if (this.error) throw this.error;
    this.submitted.push({ report, expenses });
  }
  async fetchDecisions() {
    return this.decisions;
  }
}

/** Nota de restaurante: R$ 59,90 + R$ 7,00 + 2× R$ 12,00 (cerveja) = R$ 90,90. */
export function sampleOcr(overrides: Partial<OcrResult> = {}): OcrResult {
  return {
    merchant: { name: 'Restaurante Sabor Gaúcho', taxId: '12345678000190' },
    occurredAt: '2026-10-15T11:30:00.000Z',
    paymentMethod: 'CORPORATE_CARD',
    suggestedCategory: 'MEAL',
    currency: 'BRL',
    items: [
      { description: 'Buffet livre', quantity: 1, unitPrice: 5990, total: 5990 },
      { description: 'Refrigerante', quantity: 1, unitPrice: 700, total: 700 },
      { description: 'Cerveja long neck', quantity: 2, unitPrice: 1200, total: 2400 },
    ],
    discount: 0,
    total: 9090,
    confidence: 0.95,
    ...overrides,
  };
}
