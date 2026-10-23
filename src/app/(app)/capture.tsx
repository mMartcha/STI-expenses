import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPdf } from '@/domain/gateways/ReceiptStorage';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { AppText, Button } from '@/presentation/components/ui';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useReceiptCapture, type PickedReceipt } from '@/presentation/hooks/useReceiptCapture';
import { useFeedbackStore } from '@/presentation/stores/feedbackStore';
import { font, useTheme } from '@/presentation/theme/theme';

type Source = 'camera' | 'gallery' | 'files';

/**
 * Fluxo principal de registro: a câmera abre direto (o disparo é a ação principal), com
 * galeria e arquivos como atalhos menores. Depois da foto ou da escolha vem a prévia, onde
 * "Registrar despesa" cria a despesa e volta para a home; o OCR segue em segundo plano.
 */
export default function CaptureScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const showError = useErrorAlert();
  const markRegistered = useFeedbackStore((state) => state.markRegistered);
  const { pickImage, pickFile, register, isRegistering } = useReceiptCapture();
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [picked, setPicked] = useState<{ receipt: PickedReceipt; source: Source } | null>(null);

  // Pede a permissão logo ao abrir; se já foi negada de vez, a tela oferece as configurações.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  // No Android, "voltar" na prévia retorna à câmera em vez de fechar o fluxo.
  useEffect(() => {
    if (!picked) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setPicked(null);
      return true;
    });
    return () => subscription.remove();
  }, [picked]);

  const choose = (receipt: PickedReceipt | null, source: Source) => {
    if (!receipt) return;
    // A câmera é desmontada durante a prévia; ao voltar ela precisa ficar pronta de novo.
    setCameraReady(false);
    setPicked({ receipt, source });
  };

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady || shooting) return;
    setShooting(true);
    try {
      // Mesma compressão da galeria: legível para o OCR e leve para enviar em 4G.
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: false });
      choose({ uri: photo.uri, mimeType: photo.format === 'png' ? 'image/png' : 'image/jpeg', name: null }, 'camera');
    } catch (error) {
      showError(error);
    } finally {
      setShooting(false);
    }
  };

  const confirm = async () => {
    if (!picked) return;
    try {
      await register(picked.receipt);
      markRegistered();
      router.back();
    } catch (error) {
      showError(error);
    }
  };

  if (picked) {
    const { receipt, source } = picked;
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <StatusBar style="light" />
        <View style={styles.preview}>
          {isPdf(receipt.mimeType) ? (
            <View style={styles.pdf}>
              <Icon name="pdf" size={56} color={colors.onPrimary} />
              <AppText color={colors.onPrimary} style={{ textAlign: 'center', ...font('600') }} numberOfLines={2}>
                {receipt.name ?? t('capture.pdf')}
              </AppText>
            </View>
          ) : (
            <Image source={{ uri: receipt.uri }} style={StyleSheet.absoluteFill} contentFit="contain" accessibilityLabel={t('expenses.receipt')} />
          )}
        </View>
        <View style={styles.previewActions}>
          <Button title={t('capture.register')} icon="check" loading={isRegistering} onPress={confirm} />
          <Button
            title={source === 'camera' ? t('capture.retake') : t('capture.pickAnother')}
            variant="ghost"
            disabled={isRegistering}
            onPress={() => setPicked(null)}
          />
        </View>
      </View>
    );
  }

  const cameraAllowed = permission?.granted === true;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {cameraAllowed ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setCameraReady(true)} />
      ) : permission ? (
        <View style={styles.denied}>
          <Icon name="camera" size={40} color={colors.onPrimary} />
          <AppText color={colors.onPrimary} style={{ textAlign: 'center' }}>
            {t('capture.cameraDenied')}
          </AppText>
          <Button
            title={permission.canAskAgain ? t('capture.allowCamera') : t('capture.openSettings')}
            variant="secondary"
            onPress={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
          />
        </View>
      ) : (
        <ActivityIndicator color={colors.onPrimary} style={{ flex: 1 }} />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        onPress={() => router.back()}
        hitSlop={12}
        style={[styles.close, { top: insets.top + 12 }]}>
        <Icon name="close" size={20} color="#FFFFFF" />
      </Pressable>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
        <SecondaryAction icon="gallery" label={t('capture.gallery')} onPress={async () => choose(await pickImage(), 'gallery')} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('capture.shutter')}
          disabled={!cameraReady || shooting}
          onPress={takePicture}
          style={({ pressed }) => [styles.shutter, { opacity: !cameraReady ? 0.4 : pressed ? 0.7 : 1 }]}>
          {shooting ? <ActivityIndicator color={colors.primary} /> : <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />}
        </Pressable>
        <SecondaryAction icon="folder" label={t('capture.files')} onPress={async () => choose(await pickFile(), 'files')} />
      </View>
    </View>
  );
}

function SecondaryAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={styles.secondary}>
      <View style={styles.secondaryIcon}>
        <Icon name={icon} size={22} color="#FFFFFF" />
      </View>
      <AppText variant="caption" color="#FFFFFF">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  close: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 66, height: 66, borderRadius: 33 },
  secondary: { alignItems: 'center', gap: 6, width: 72 },
  secondaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  preview: { flex: 1 },
  pdf: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  previewActions: { gap: 4, paddingHorizontal: 16, paddingTop: 16 },
});
