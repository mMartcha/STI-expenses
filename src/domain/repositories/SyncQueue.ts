export type SyncOperationType =
  | 'RECEIPT_OCR'
  | 'EXPENSE_UPSERT'
  | 'EXPENSE_DELETE'
  | 'REPORT_UPSERT'
  | 'REPORT_SUBMIT'
  | 'REPORT_DELETE';

export interface SyncOperation {
  /** Também é a chave de idempotência enviada ao servidor. */
  readonly id: string;
  readonly type: SyncOperationType;
  readonly entityId: string;
  readonly attempts: number;
  /** Muda se a entidade foi alterada de novo enquanto esta operação era enviada. */
  readonly revision: number;
  readonly nextAttemptAt: string;
  readonly lastError: string | null;
  /** DEAD = esgotou tentativas ou erro permanente; exige ação do usuário/suporte. */
  readonly status: 'PENDING' | 'DEAD';
  readonly createdAt: string;
}

/**
 * Fila de saída (outbox) persistida localmente. Garante que nada se perde sem internet:
 * cada alteração vira uma operação que é enviada assim que houver conexão.
 */
export interface SyncQueue {
  /** Operações *_UPSERT/RECEIPT_OCR são deduplicadas por (tipo, entidade). */
  enqueue(op: { type: SyncOperationType; entityId: string }): Promise<void>;
  listDue(now: Date, limit: number): Promise<SyncOperation[]>;
  /** Conclui a operação — exceto se ela foi reenfileirada (nova revisão) durante o envio. */
  complete(op: SyncOperation): Promise<void>;
  removeForEntity(entityId: string): Promise<void>;
  reschedule(id: string, update: { attempts: number; nextAttemptAt: string; lastError: string | null; dead: boolean }): Promise<void>;
  countPending(): Promise<number>;
  countDead(): Promise<number>;
  /** Recoloca na fila as operações mortas (ex.: botão "tentar novamente"). */
  reviveDead(now: Date): Promise<void>;
}
