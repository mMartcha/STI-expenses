import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Receipt } from '@/domain/entities/Expense';

import { loadNativeModule } from './loadNativeModule';

// Intent.FLAG_GRANT_READ_URI_PERMISSION
const FLAG_GRANT_READ_URI_PERMISSION = 1;

export class NativeModuleUnavailableError extends Error {
  constructor() {
    super('Módulo nativo indisponível neste build');
    this.name = 'NativeModuleUnavailableError';
  }
}

/**
 * Abre um comprovante em PDF no visualizador do sistema.
 * Android: Intent VIEW com content:// (o file:// é bloqueado entre apps).
 * iOS: pré-visualização/compartilhamento nativo.
 */
export async function openReceiptDocument(receipt: Receipt): Promise<void> {
  if (Platform.OS === 'android') {
    const launcher = await loadNativeModule(() => import('expo-intent-launcher'));
    if (!launcher) throw new NativeModuleUnavailableError();
    await launcher.startActivityAsync('android.intent.action.VIEW', {
      data: new File(receipt.localUri).contentUri,
      type: receipt.mimeType,
      flags: FLAG_GRANT_READ_URI_PERMISSION,
    });
    return;
  }
  const sharing = await loadNativeModule(() => import('expo-sharing'));
  if (!sharing) throw new NativeModuleUnavailableError();
  await sharing.shareAsync(receipt.localUri, { mimeType: receipt.mimeType, UTI: 'com.adobe.pdf' });
}
