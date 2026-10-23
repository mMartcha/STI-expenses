import { ValidationError } from '@/core/errors';
import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import type { CaptureReceiptInput } from './CaptureReceiptUseCase';

/** Limite por lote: cobre uma viagem inteira sem pesar na memória nem no envio. */
export const RECEIPT_BATCH_LIMIT = 20;

export interface CaptureReceiptBatchResult {
  created: Expense[];
  /** Posições (no lote enviado) dos comprovantes que não viraram despesa. */
  failed: { index: number; error: unknown }[];
}

/**
 * Vários comprovantes → várias despesas, cada uma com o mesmo tratamento do
 * `CaptureReceiptUseCase` (cópia para a área privada, despesa aguardando leitura e OCR na fila).
 *
 * Cada comprovante é independente: uma foto inválida não impede as outras. Se nenhum
 * comprovante puder ser registrado, o primeiro erro é lançado para a tela explicar o motivo.
 * Roda em sequência para manter a ordem da captura e não disputar o disco.
 */
export class CaptureReceiptBatchUseCase implements UseCase<readonly CaptureReceiptInput[], CaptureReceiptBatchResult> {
  constructor(private readonly captureReceipt: UseCase<CaptureReceiptInput, Expense>) {}

  async execute(inputs: readonly CaptureReceiptInput[]): Promise<CaptureReceiptBatchResult> {
    if (inputs.length === 0) throw new ValidationError('receipt', 'Nenhum comprovante informado');
    if (inputs.length > RECEIPT_BATCH_LIMIT) {
      throw new ValidationError('receipt', 'Comprovantes demais no lote', { max: RECEIPT_BATCH_LIMIT });
    }

    const result: CaptureReceiptBatchResult = { created: [], failed: [] };
    for (const [index, input] of inputs.entries()) {
      try {
        result.created.push(await this.captureReceipt.execute(input));
      } catch (error) {
        result.failed.push({ index, error });
      }
    }

    if (result.created.length === 0) throw result.failed[0].error;
    return result;
  }
}
