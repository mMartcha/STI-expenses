import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';

import { PDF_MIME_TYPE } from '@/domain/gateways/ReceiptStorage';

import { useDependencies } from '../providers/DependenciesProvider';
import { loadNativeModule } from '../utils/loadNativeModule';
import { useUseCaseMutation } from './queries';

/** Comprovante escolhido, ainda não registrado: o usuário confere na pré-visualização antes. */
export interface PickedReceipt {
  uri: string;
  mimeType: string | null;
  /** Nome do arquivo (só vem do seletor de arquivos; usado na prévia de PDF). */
  name: string | null;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Compressão moderada: legível para o OCR e leve para enviar em 4G.
  quality: 0.7,
  // Não coletamos metadados (localização etc.) da foto.
  exif: false,
};

/**
 * Origens secundárias do comprovante (galeria e arquivos) e o registro final. A câmera fica
 * na própria tela de captura (`expo-camera`). Nada é gravado ao escolher: a despesa só nasce
 * em `register`, depois que o usuário confirma a prévia — assim foto ruim não vira despesa.
 *
 * O seletor de arquivos é carregado sob demanda (`loadNativeModule`): se o binário instalado
 * for antigo, só aquela ação avisa o usuário, sem derrubar a tela.
 */
export function useReceiptCapture() {
  const { t } = useTranslation();
  const { captureReceiptUseCase } = useDependencies();
  const mutation = useUseCaseMutation(captureReceiptUseCase.execute.bind(captureReceiptUseCase));

  const pickImage = async (): Promise<PickedReceipt | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('expenses.galleryDenied'), undefined, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: 'OK', onPress: () => void Linking.openSettings() },
      ]);
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    const asset = result.canceled ? null : result.assets[0];
    return asset ? { uri: asset.uri, mimeType: asset.mimeType ?? null, name: asset.fileName ?? null } : null;
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
    return asset ? { uri: asset.uri, mimeType: asset.mimeType ?? null, name: asset.name } : null;
  };

  const register = (receipt: PickedReceipt) =>
    mutation.mutateAsync({ kind: 'file', sourceUri: receipt.uri, mimeType: receipt.mimeType });

  return { pickImage, pickFile, register, isRegistering: mutation.isPending };
}
