import { RemoteError } from '@/core/errors';
import type { IdGenerator } from '@/core/ports';
import type { OcrResult } from '@/domain/entities/OcrResult';
import type { OcrGateway } from '@/domain/gateways/OcrGateway';

import { latency } from './delay';
import { OCR_FIXTURES } from './ocrFixtures';

export interface MockOcrOptions {
  /** Probabilidade (0–1) de a nota ser "ilegível", para testar o fluxo manual. */
  unreadableRate?: number;
}

/** OCR simulado: devolve as notas de exemplo em rodízio, com latência realista. */
export class MockOcrGateway implements OcrGateway {
  private counter = 0;
  private readonly uploads = new Map<string, string>();

  constructor(
    private readonly ids: IdGenerator,
    private readonly options: MockOcrOptions = {},
  ) {}

  async uploadReceipt(input: { localUri: string; idempotencyKey: string }): Promise<string> {
    await latency(400, 900);
    // Mesma chave de idempotência → mesmo comprovante (como o servidor real deve fazer).
    const existing = this.uploads.get(input.idempotencyKey);
    if (existing) return existing;
    const receiptId = `rcpt_${this.ids.next()}`;
    this.uploads.set(input.idempotencyKey, receiptId);
    return receiptId;
  }

  async recognize(): Promise<OcrResult> {
    await latency(1200, 2200);
    if (Math.random() < (this.options.unreadableRate ?? 0)) {
      throw new RemoteError('Não foi possível ler a nota', false, 422);
    }
    const fixture = OCR_FIXTURES[this.counter++ % OCR_FIXTURES.length];
    return { ...fixture, occurredAt: new Date(Date.now() - 15 * 60_000).toISOString() };
  }
}
