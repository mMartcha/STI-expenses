import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';

import { PDF_MIME_TYPE } from '@/domain/gateways/ReceiptStorage';
import type { CaptureReceiptInput } from '@/domain/usecases/expense/CaptureReceiptUseCase';

import { useDependencies } from '../providers/DependenciesProvider';
import { loadNativeModule } from '../utils/loadNativeModule';
import { useErrorAlert } from './useAsyncAction';
import { useUseCaseMutation } from './queries';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Compressão moderada: legível para o OCR e leve para enviar em 4G.
  quality: 0.7,
  // Não coletamos metadados (localização etc.) da foto.
  exif: false,
};

/**
 * Clipboard e seletor de arquivos são carregados sob demanda (`loadNativeModule`): se o
 * binário instalado for antigo, só aquela ação avisa o usuário, sem derrubar a tela.
 *
 * As quatro origens de comprovante da home — Escanear (câmera), Arquivos (PDF/imagem),
 * Imagens (galeria) e Colar (área de transferência) — todas terminam no CaptureReceiptUseCase.
 */
export function useReceiptCapture() {
  const { t } = useTranslation();
  const { captureReceiptUseCase } = useDependencies();
  const showError = useErrorAlert();
  const mutation = useUseCaseMutation(captureReceiptUseCase.execute.bind(captureReceiptUseCase));

  const capture = async (input: CaptureReceiptInput) => {
    try {
      const expense = await mutation.mutateAsync(input);
      router.push({ pathname: '/expense/[id]', params: { id: expense.id } });
    } catch (error) {
      showError(error);
    }
  };

  const fromImagePicker = async (result: ImagePicker.ImagePickerResult) => {
    const asset = result.canceled ? null : result.assets[0];
    if (asset) await capture({ kind: 'file', sourceUri: asset.uri, mimeType: asset.mimeType ?? null });
  };

  const deniedAlert = (message: string) =>
    Alert.alert(message, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: 'OK', onPress: () => void Linking.openSettings() },
    ]);

  const scan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return deniedAlert(t('expenses.cameraDenied'));
    await fromImagePicker(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return deniedAlert(t('expenses.galleryDenied'));
    await fromImagePicker(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  };

  const pickFile = async () => {
    const DocumentPicker = await loadNativeModule(() => import('expo-document-picker'));
    if (!DocumentPicker) return Alert.alert(t('errors.nativeUnavailable'));
    const result = await DocumentPicker.getDocumentAsync({
      type: [PDF_MIME_TYPE, 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (asset) await capture({ kind: 'file', sourceUri: asset.uri, mimeType: asset.mimeType ?? null });
  };

  const paste = async () => {
    const Clipboard = await loadNativeModule(() => import('expo-clipboard'));
    if (!Clipboard) return Alert.alert(t('errors.nativeUnavailable'));
    // No iOS 16+ o sistema pede permissão para colar; negar também resulta em `null`.
    const image = await Clipboard.getImageAsync({ format: 'jpeg', jpegQuality: 0.8 });
    if (!image) return Alert.alert(t('home.pasteEmptyTitle'), t('home.pasteEmptyMessage'));
    await capture({ kind: 'base64', data: image.data, mimeType: 'image/jpeg' });
  };

  return { scan, pickImage, pickFile, paste, isProcessing: mutation.isPending };
}
