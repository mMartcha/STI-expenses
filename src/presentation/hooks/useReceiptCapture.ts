import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';

import { PDF_MIME_TYPE } from '@/domain/gateways/ReceiptStorage';

import { useDependencies } from '../providers/DependenciesProvider';
import { loadNativeModule } from '../utils/loadNativeModule';
import { useUseCaseMutation } from './queries';

/** Comprovante escolhido, ainda não registrado: o usuário confere na revisão antes. */
export interface PickedReceipt {
  /** Id local, só para a lista da tela (chave de renderização, remoção). */
  key: string;
  uri: string;
  mimeType: string | null;
  /** Nome do arquivo (vem do seletor de arquivos; usado na prévia de PDF). */
  name: string | null;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Compressão moderada: legível para o OCR e leve para enviar em 4G.
  quality: 0.7,
  // Não coletamos metadados (localização etc.) da foto.
  exif: false,
};

let sequence = 0;
/** Chave única por sessão (não é persistida nem enviada). */
export function newPickedKey(): string {
  sequence += 1;
  return `picked-${Date.now()}-${sequence}`;
}

/**
 * Origens secundárias do comprovante (galeria e arquivos) e o registro final. A câmera fica
 * na própria tela de captura (`expo-camera`). Nada é gravado ao escolher: as despesas só nascem
 * em `registerAll`, depois que o usuário confirma a revisão — assim foto ruim não vira despesa.
 *
 * O seletor de arquivos é carregado sob demanda (`loadNativeModule`): se o binário instalado
 * for antigo, só aquela ação avisa o usuário, sem derrubar a tela.
 */
export function useReceiptCapture() {
  const { t } = useTranslation();
  const { captureReceiptBatchUseCase } = useDependencies();
  const mutation = useUseCaseMutation(captureReceiptBatchUseCase.execute.bind(captureReceiptBatchUseCase));

  /** `limit` > 1 permite escolher várias imagens de uma vez (modo vários comprovantes). */
  const pickImages = async (limit = 1): Promise<PickedReceipt[]> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('expenses.galleryDenied'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('capture.openSettings'), onPress: () => void Linking.openSettings() },
      ]);
      return [];
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      ...PICKER_OPTIONS,
      allowsMultipleSelection: limit > 1,
      selectionLimit: limit,
      orderedSelection: true,
    });
    if (result.canceled) return [];
    return result.assets.slice(0, limit).map((asset) => ({
      key: newPickedKey(),
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      name: asset.fileName ?? null,
    }));
  };

  const pickFile = async (): Promise<PickedReceipt | null> => {
    const DocumentPicker = await loadNativeModule(() => import('expo-document-picker'));
    if (!DocumentPicker) {
      Alert.alert(t('errors.nativeUnavailable'));
      return null;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: [PDF_MIME_TYPE, 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = result.canceled ? null : result.assets[0];
    return asset ? { key: newPickedKey(), uri: asset.uri, mimeType: asset.mimeType ?? null, name: asset.name } : null;
  };

  const registerAll = (receipts: readonly PickedReceipt[]) =>
    mutation.mutateAsync(receipts.map((receipt) => ({ kind: 'file' as const, sourceUri: receipt.uri, mimeType: receipt.mimeType })));

  return { pickImages, pickFile, registerAll, isRegistering: mutation.isPending };
}
