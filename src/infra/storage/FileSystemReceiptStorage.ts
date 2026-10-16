import { Directory, File, Paths } from 'expo-file-system';

import { ValidationError } from '@/core/errors';
import type { IdGenerator, Logger } from '@/core/ports';
import { PDF_MIME_TYPE, type ReceiptStorage, type StoredReceipt } from '@/domain/gateways/ReceiptStorage';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
  [PDF_MIME_TYPE]: 'pdf',
};

/** 15 MB: acima disso é quase certo que não é uma nota comum (e pesaria no envio em 4G). */
const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Copia os comprovantes para `documents/receipts` (área privada do app, não aparece na
 * galeria e não é apagada pelo sistema como o cache).
 */
export class FileSystemReceiptStorage implements ReceiptStorage {
  private readonly directory = new Directory(Paths.document, 'receipts');

  constructor(
    private readonly ids: IdGenerator,
    private readonly logger: Logger,
  ) {}

  async persist(sourceUri: string, mimeType: string | null): Promise<StoredReceipt> {
    const type = normalizeType(mimeType ?? guessType(sourceUri));
    const source = new File(sourceUri);
    if (!source.exists) throw new ValidationError('receipt', 'Arquivo não encontrado');
    if ((source.size ?? 0) > MAX_BYTES) throw new ValidationError('receipt', 'Arquivo muito grande');

    const destination = this.newFile(type);
    await source.copy(destination);
    return { localUri: destination.uri, mimeType: type };
  }

  async persistBase64(base64: string, mimeType: string): Promise<StoredReceipt> {
    const type = normalizeType(mimeType);
    const payload = base64.replace(/^data:[^;]+;base64,/, '');
    // base64 ocupa ~4/3 do tamanho binário.
    if ((payload.length * 3) / 4 > MAX_BYTES) throw new ValidationError('receipt', 'Arquivo muito grande');

    const destination = this.newFile(type);
    destination.write(payload, { encoding: 'base64' });
    return { localUri: destination.uri, mimeType: type };
  }

  async remove(localUri: string): Promise<void> {
    try {
      const file = new File(localUri);
      // Defesa: só apaga arquivos dentro da pasta de comprovantes do app.
      if (!file.uri.startsWith(this.directory.uri)) return;
      if (file.exists) file.delete();
    } catch (error) {
      this.logger.warn('Falha ao remover comprovante', { error: String(error) });
    }
  }

  async clearAll(): Promise<void> {
    if (this.directory.exists) this.directory.delete();
  }

  private newFile(type: string): File {
    this.directory.create({ idempotent: true, intermediates: true });
    return new File(this.directory, `${this.ids.next()}.${ALLOWED_TYPES[type]}`);
  }
}

function normalizeType(mimeType: string): string {
  const type = mimeType.toLowerCase();
  if (!ALLOWED_TYPES[type]) throw new ValidationError('receipt', 'Formato de arquivo não suportado', { type });
  return type === 'image/jpg' ? 'image/jpeg' : type;
}

function guessType(uri: string): string {
  return uri.toLowerCase().endsWith('.pdf') ? PDF_MIME_TYPE : 'image/jpeg';
}
