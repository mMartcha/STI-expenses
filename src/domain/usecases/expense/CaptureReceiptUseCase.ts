import { createChangeContext, type Clock, type IdGenerator } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import { Expense } from '../../entities/Expense';
import type { ReceiptStorage, StoredReceipt } from '../../gateways/ReceiptStorage';
import type { SyncScheduler } from '../../gateways/SyncScheduler';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import type { SyncQueue } from '../../repositories/SyncQueue';
import { DEFAULT_CURRENCY } from '../../shared/Money';
import { requireSession } from '../shared';

/**
 * Origem do comprovante:
 * - `file`: URI temporária da câmera, galeria ou seletor de arquivos (imagem ou PDF);
 * - `base64`: conteúdo colado da área de transferência.
 */
export type CaptureReceiptInput =
  | { kind: 'file'; sourceUri: string; mimeType: string | null }
  | { kind: 'base64'; data: string; mimeType: string };

/**
 * Comprovante → despesa. O arquivo é copiado para a área privada do app, a despesa é criada
 * como "aguardando leitura" e o OCR entra na fila: com internet roda na hora, sem
 * internet roda quando a conexão voltar. O usuário pode preencher manualmente enquanto isso.
 */
export class CaptureReceiptUseCase implements UseCase<CaptureReceiptInput, Expense> {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly receipts: ReceiptStorage,
    private readonly queue: SyncQueue,
    private readonly scheduler: SyncScheduler,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: CaptureReceiptInput): Promise<Expense> {
    const session = requireSession(this.sessions);
    const stored = await this.store(input);

    try {
      const expense = Expense.createFromReceipt(
        { ownerId: session.user.id, receipt: stored, currency: DEFAULT_CURRENCY },
        createChangeContext(session.user.id, this.clock, this.ids),
      );
      await this.expenses.save(expense);
      await this.queue.enqueue({ type: 'RECEIPT_OCR', entityId: expense.id });
      this.scheduler.request();
      return expense;
    } catch (error) {
      await this.receipts.remove(stored.localUri);
      throw error;
    }
  }

  private store(input: CaptureReceiptInput): Promise<StoredReceipt> {
    return input.kind === 'file'
      ? this.receipts.persist(input.sourceUri, input.mimeType)
      : this.receipts.persistBase64(input.data, input.mimeType);
  }
}
