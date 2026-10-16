export interface StoredReceipt {
  localUri: string;
  mimeType: string;
}

/** Guarda os comprovantes (fotos ou PDFs) na área privada do app. */
export interface ReceiptStorage {
  /** Copia um arquivo local (câmera, galeria, seletor de arquivos). */
  persist(sourceUri: string, mimeType: string | null): Promise<StoredReceipt>;
  /** Grava um conteúdo em base64 (ex.: imagem colada da área de transferência). */
  persistBase64(base64: string, mimeType: string): Promise<StoredReceipt>;
  remove(localUri: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const PDF_MIME_TYPE = 'application/pdf';

export function isPdf(mimeType: string | null | undefined): boolean {
  return mimeType === PDF_MIME_TYPE;
}
