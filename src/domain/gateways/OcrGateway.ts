import type { OcrResult } from '../entities/OcrResult';

/**
 * Upload do comprovante e leitura (OCR) em duas etapas, para que a sincronização
 * possa retomar de onde parou: se o upload já foi feito, só a leitura é refeita.
 */
export interface OcrGateway {
  /** Envia a imagem e devolve o id do comprovante no servidor. */
  uploadReceipt(input: { localUri: string; mimeType: string; idempotencyKey: string }): Promise<string>;
  /** Lê os campos do comprovante já enviado. Erro não-retentável = nota ilegível. */
  recognize(receiptRemoteId: string): Promise<OcrResult>;
}
