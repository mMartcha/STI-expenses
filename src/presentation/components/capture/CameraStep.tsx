import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RECEIPT_BATCH_LIMIT } from '@/domain/usecases/expense/CaptureReceiptBatchUseCase';

import { useErrorToast } from '../../hooks/useAsyncAction';
import { newPickedKey, useReceiptCapture, type PickedReceipt } from '../../hooks/useReceiptCapture';
import { useFeedbackStore } from '../../stores/feedbackStore';
import { useStyles, useTheme } from '../../theme/theme';
import type { CameraStepProps } from '../../types/component.types';
import { ActionSheet } from '../BottomSheet';
import { IconButton } from '../IconButton';
import { BatchTip } from './BatchTip';
import { CameraPermissionPrompt } from './CameraPermissionPrompt';
import { ReceiptStrip } from './ReceiptStrip';
import { CONTROL_SIZE, createStyles } from './styles';

/**
 * Câmera da captura: visor com flash, pré-permissão, faixa do lote e controles
 * (anexar · obturador · vários comprovantes).
 */
export function CameraStep({ batch, onBatchChange, receipts, onAdd, onRemove, onReview }: CameraStepProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const showError = useErrorToast();
  const { pickImages, pickFile } = useReceiptCapture();
  const [permission, requestPermission] = useCameraPermissions();
  const batchTipSeen = useFeedbackStore((state) => state.batchTipSeen);
  const markBatchTipSeen = useFeedbackStore((state) => state.markBatchTipSeen);

  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [flash, setFlash] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const room = RECEIPT_BATCH_LIMIT - receipts.length;
  const full = batch && room <= 0;
  const shutterDisabled = !cameraReady || shooting || full;

  const takePicture = async () => {
    if (!cameraRef.current || shutterDisabled) return;
    setShooting(true);
    try {
      // Mesma compressão da galeria: legível para o OCR e leve para enviar em 4G.
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, exif: false });
      onAdd([{ key: newPickedKey(), uri: photo.uri, mimeType: photo.format === 'png' ? 'image/png' : 'image/jpeg', name: null }]);
    } catch (error) {
      showError(error);
    } finally {
      setShooting(false);
    }
  };

  /** Seletores do sistema podem falhar (permissão, arquivo inválido): o erro vira mensagem amigável. */
  const attachFrom = (pick: () => Promise<PickedReceipt[]>) => async () => {
    try {
      onAdd(await pick());
    } catch (error) {
      showError(error);
    }
  };

  const toggleBatch = () => {
    const next = !batch;
    onBatchChange(next);
    if (next && !batchTipSeen) {
      markBatchTipSeen();
      setShowTip(true);
    }
  };

  return (
    <View style={styles.flex}>
      {/* Visor */}
      <View style={styles.viewfinder}>
        {permission?.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              flash={flash ? 'on' : 'off'}
              onCameraReady={() => setCameraReady(true)}
            />
            <IconButton
              icon={flash ? 'flashOn' : 'flashOff'}
              variant={flash ? 'primary' : 'media'}
              accessibilityLabel={flash ? t('capture.flashOff') : t('capture.flashOn')}
              accessibilityState={{ selected: flash }}
              iconSize={20}
              onPress={() => setFlash((value) => !value)}
              style={styles.flash}
            />
          </>
        ) : permission ? (
          <CameraPermissionPrompt
            canAskAgain={permission.canAskAgain}
            onContinue={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
          />
        ) : (
          <ActivityIndicator color={colors.onMedia} style={styles.flex} />
        )}
      </View>

      {batch ? <ReceiptStrip receipts={receipts} onRemove={onRemove} onReview={onReview} /> : null}

      {/* Controles */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <IconButton
          icon="gallery"
          variant="filled"
          size={CONTROL_SIZE}
          iconSize={24}
          accessibilityLabel={t('capture.attach')}
          onPress={() => setAttaching(true)}
          disabled={full}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('capture.shutter')}
          accessibilityState={{ disabled: shutterDisabled }}
          disabled={shutterDisabled}
          onPress={takePicture}
          style={({ pressed }) => [styles.shutter, { opacity: !cameraReady || full ? 0.4 : pressed ? 0.7 : 1 }]}>
          {shooting ? <ActivityIndicator color={colors.primary} /> : <View style={styles.shutterInner} />}
        </Pressable>
        <IconButton
          icon="multiple"
          variant={batch ? 'brandSoft' : 'filled'}
          size={CONTROL_SIZE}
          iconSize={24}
          accessibilityLabel={batch ? t('capture.batchOff') : t('capture.batchOn')}
          accessibilityState={{ selected: batch }}
          onPress={toggleBatch}
          // Com fotos no lote, sair do modo apagaria o trabalho: revise ou remova antes.
          disabled={batch && receipts.length > 0}
        />
      </View>

      <ActionSheet
        visible={attaching}
        onClose={() => setAttaching(false)}
        items={[
          { key: 'gallery', icon: 'gallery', label: t('capture.fromGallery'), onPress: attachFrom(() => pickImages(batch ? room : 1)) },
          {
            key: 'files',
            icon: 'attach',
            label: t('capture.fromFiles'),
            onPress: attachFrom(async () => {
              const file = await pickFile();
              return file ? [file] : [];
            }),
          },
        ]}
      />

      <BatchTip visible={showTip} onClose={() => setShowTip(false)} />
    </View>
  );
}
