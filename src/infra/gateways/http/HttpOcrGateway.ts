import type { OcrResult } from '@/domain/entities/OcrResult';
import type { OcrGateway } from '@/domain/gateways/OcrGateway';

import type { HttpClient } from '../../http/HttpClient';
import { ocrResultDto, receiptUploadDto } from '../../http/dto';

export class HttpOcrGateway implements OcrGateway {
  constructor(private readonly http: HttpClient) {}

  async uploadReceipt(input: { localUri: string; mimeType: string; idempotencyKey: string }): Promise<string> {
    const form = new FormData();
    // Formato aceito pelo FormData do React Native para arquivos locais.
    form.append('file', { uri: input.localUri, type: input.mimeType, name: 'receipt' } as unknown as Blob);
    const { receiptId } = await this.http.upload('/receipts', form, {
      schema: receiptUploadDto,
      idempotencyKey: input.idempotencyKey,
    });
    return receiptId;
  }

  recognize(receiptRemoteId: string): Promise<OcrResult> {
    return this.http.request(`/receipts/${encodeURIComponent(receiptRemoteId)}/ocr`, {
      method: 'POST',
      schema: ocrResultDto,
      timeoutMs: 60_000,
    });
  }
}
