import { DependencyNotReadyError, RemoteError } from '@/core/errors';
import { createChangeContext, type Clock, type IdGenerator, type Logger } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { ExpenseSyncGateway } from '../../gateways/ExpenseSyncGateway';
import type { OcrGateway } from '../../gateways/OcrGateway';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { ReportRepository } from '../../repositories/ReportRepository';
import type { SyncOperation, SyncQueue } from '../../repositories/SyncQueue';
import { SYSTEM_ACTOR } from '../shared';

export interface SyncRunResult {
  sent: number;
  failed: number;
  deferred: number;
}

export const SYNC_POLICY = {
  batchSize: 25,
  maxAttempts: 8,
  baseDelayMs: 5_000,
  maxDelayMs: 30 * 60_000,
  dependencyDelayMs: 15_000,
} as const;

/** Backoff exponencial com jitter: evita que milhares de aparelhos tentem ao mesmo tempo. */
export function computeBackoff(attempts: number, random: () => number = Math.random): number {
  const exponential = Math.min(SYNC_POLICY.maxDelayMs, SYNC_POLICY.baseDelayMs * 2 ** (attempts - 1));
  const jitter = exponential * 0.2 * (random() * 2 - 1);
  return Math.round(exponential + jitter);
}

/**
 * Executa uma rodada da fila de saída. Cada operação é independente: uma falha não
 * bloqueia as demais. Erros temporários (rede, 5xx) são retentados com backoff;
 * erros permanentes (4xx) marcam a operação como "DEAD" e a entidade como falha.
 */
export class ProcessSyncQueueUseCase implements UseCase<void, SyncRunResult> {
  constructor(
    private readonly queue: SyncQueue,
    private readonly expenses: ExpenseRepository,
    private readonly reports: ReportRepository,
    private readonly ocr: OcrGateway,
    private readonly gateway: ExpenseSyncGateway,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<SyncRunResult> {
    const result: SyncRunResult = { sent: 0, failed: 0, deferred: 0 };
    const operations = await this.queue.listDue(this.clock.now(), SYNC_POLICY.batchSize);

    for (const op of operations) {
      try {
        await this.handle(op);
        await this.queue.complete(op);
        result.sent += 1;
      } catch (error) {
        if (error instanceof DependencyNotReadyError) {
          await this.queue.reschedule(op.id, {
            attempts: op.attempts,
            nextAttemptAt: this.later(SYNC_POLICY.dependencyDelayMs),
            lastError: error.message,
            dead: false,
          });
          result.deferred += 1;
          continue;
        }
        await this.handleFailure(op, error);
        result.failed += 1;
      }
    }
    return result;
  }

  private async handle(op: SyncOperation): Promise<void> {
    switch (op.type) {
      case 'RECEIPT_OCR':
        return this.processReceipt(op);
      case 'EXPENSE_UPSERT': {
        const expense = await this.expenses.findById(op.entityId);
        if (!expense) return;
        if (expense.receipt && !expense.receipt.remoteId) {
          throw new DependencyNotReadyError('Comprovante ainda não enviado');
        }
        await this.gateway.upsertExpense(expense, op.id);
        await this.expenses.markSynced(expense.id, expense.version);
        return;
      }
      case 'EXPENSE_DELETE':
        return this.gateway.deleteExpense(op.entityId, op.id);
      case 'REPORT_UPSERT': {
        const report = await this.reports.findById(op.entityId);
        if (!report) return;
        await this.gateway.upsertReport(report, op.id);
        await this.reports.markSynced(report.id, report.version);
        return;
      }
      case 'REPORT_SUBMIT': {
        const report = await this.reports.findById(op.entityId);
        if (!report) return;
        const expenses = await this.expenses.listByReport(report.id);
        const notReady = expenses.some(
          (expense) => expense.ocrStatus === 'PENDING' || (expense.receipt !== null && !expense.receipt.remoteId),
        );
        if (notReady) throw new DependencyNotReadyError('Aguardando leitura/envio de comprovantes');
        await this.gateway.submitReport(report, expenses, op.id);
        await this.reports.markSynced(report.id, report.version);
        return;
      }
      case 'REPORT_DELETE':
        return this.gateway.deleteReport(op.entityId, op.id);
    }
  }

  /** Upload (se ainda não feito) + leitura. Retomável: cada etapa concluída é persistida. */
  private async processReceipt(op: SyncOperation): Promise<void> {
    let expense = await this.expenses.findById(op.entityId);
    if (!expense?.receipt || expense.locked) return;

    if (!expense.receipt.remoteId) {
      const remoteId = await this.ocr.uploadReceipt({
        localUri: expense.receipt.localUri,
        mimeType: expense.receipt.mimeType,
        idempotencyKey: op.id,
      });
      expense = expense.withReceiptUploaded(remoteId);
      await this.expenses.save(expense);
    }

    const ctx = createChangeContext(SYSTEM_ACTOR.ocr, this.clock, this.ids);
    try {
      const result = await this.ocr.recognize(expense.receipt!.remoteId!);
      // Relê: o usuário pode ter editado a despesa enquanto o OCR processava.
      const latest = (await this.expenses.findById(expense.id)) ?? expense;
      if (latest.locked) return;
      await this.expenses.save(latest.applyOcrResult(result, ctx));
    } catch (error) {
      if (error instanceof RemoteError && !error.retryable) {
        // Nota ilegível: não adianta tentar de novo; o usuário preenche manualmente.
        const latest = (await this.expenses.findById(expense.id)) ?? expense;
        await this.expenses.save(latest.markOcrFailed(error.message, ctx));
      } else {
        throw error;
      }
    }
    await this.queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });
  }

  private async handleFailure(op: SyncOperation, error: unknown): Promise<void> {
    const attempts = op.attempts + 1;
    const retryable = !(error instanceof RemoteError) || error.retryable;
    const dead = !retryable || attempts >= SYNC_POLICY.maxAttempts;
    const message = error instanceof Error ? error.message : String(error);

    this.logger.warn('Falha na sincronização', { type: op.type, attempts, dead, message });
    await this.queue.reschedule(op.id, {
      attempts,
      nextAttemptAt: this.later(computeBackoff(attempts)),
      lastError: message.slice(0, 500),
      dead,
    });
    if (dead) await this.markEntityFailed(op);
  }

  private async markEntityFailed(op: SyncOperation): Promise<void> {
    if (op.type === 'RECEIPT_OCR' || op.type === 'EXPENSE_UPSERT') {
      const expense = await this.expenses.findById(op.entityId);
      if (expense) await this.expenses.save(expense.markSyncFailed());
    } else if (op.type === 'REPORT_UPSERT' || op.type === 'REPORT_SUBMIT') {
      const report = await this.reports.findById(op.entityId);
      if (report) await this.reports.save(report.markSyncFailed());
    }
  }

  private later(ms: number): string {
    return new Date(this.clock.now().getTime() + ms).toISOString();
  }
}
