import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPdf } from '@/domain/gateways/ReceiptStorage';
import { RECEIPT_BATCH_LIMIT } from '@/domain/usecases/expense/CaptureReceiptBatchUseCase';
import { ActionSheet, BottomSheet } from '@/presentation/components/BottomSheet';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { ManualExpenseForm } from '@/presentation/components/ManualExpenseForm';
import { SegmentedControl } from '@/presentation/components/SegmentedControl';
import { AppText, Button } from '@/presentation/components/ui';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { newPickedKey, useReceiptCapture, type PickedReceipt } from '@/presentation/hooks/useReceiptCapture';
import { useFeedbackStore } from '@/presentation/stores/feedbackStore';
import { radius, sizes, useTheme } from '@/presentation/theme/theme';

type Mode = 'scan' | 'manual';
type Step = 'camera' | 'review';

/**
 * Criar despesa. Duas abas na mesma tela:
 * - Escanear: câmera com galeria/arquivos e modo "vários comprovantes". Nada é gravado ao
 *   fotografar: tudo passa pela revisão ("1 de N") e só vira despesa em "Criar N despesas".
 *   O OCR roda depois, em segundo plano.
 * - Manual: despesa sem comprovante.
 */
export default function CaptureScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const markRegistered = useFeedbackStore((state) => state.markRegistered);

  const [mode, setMode] = useState<Mode>(params.mode === 'manual' ? 'manual' : 'scan');
  const [step, setStep] = useState<Step>('camera');
  const [batch, setBatch] = useState(false);
  const [receipts, setReceipts] = useState<PickedReceipt[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const confirmDiscard = (onDiscard: () => void) => {
    if (receipts.length === 0) return onDiscard();
    Alert.alert(t('capture.discardTitle'), t('capture.discardMessage', { count: receipts.length }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('capture.discard'), style: 'destructive', onPress: onDiscard },
    ]);
  };

  const close = () => confirmDiscard(() => router.back());

  /** Voltar da revisão: no modo lote mantém as fotos; no modo simples descarta (tirar outra). */
  const backToCamera = () => {
    if (!batch) setReceipts([]);
    setStep('camera');
  };

  // Android: "voltar" segue a mesma lógica do botão da tela.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'review') backToCamera();
      else close();
      return true;
    });
    return () => subscription.remove();
  });

  const addReceipts = (added: PickedReceipt[]) => {
    if (added.length === 0) return;
    if (!batch) {
      setReceipts(added.slice(0, 1));
      setReviewIndex(0);
      setStep('review');
      return;
    }
    const room = RECEIPT_BATCH_LIMIT - receipts.length;
    if (added.length > room) Alert.alert(t('capture.batchLimit', { count: RECEIPT_BATCH_LIMIT }));
    setReceipts((current) => [...current, ...added.slice(0, room)]);
  };

  const removeReceipt = (key: string) => {
    const next = receipts.filter((receipt) => receipt.key !== key);
    setReceipts(next);
    if (next.length === 0) setStep('camera');
    else setReviewIndex((index) => Math.min(index, next.length - 1));
  };

  const finish = (count: number) => {
    markRegistered(count);
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {step === 'review' ? (
        <ReviewStep
          receipts={receipts}
          index={reviewIndex}
          onIndexChange={setReviewIndex}
          onBack={backToCamera}
          onRemove={removeReceipt}
          onRegistered={finish}
        />
      ) : (
        <>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={close} hitSlop={12} style={styles.headerButton}>
              <Icon name="close" size={22} color={colors.textPrimary} />
            </Pressable>
            <AppText variant="title" accessibilityRole="header">
              {t('capture.title')}
            </AppText>
          </View>

          <View style={styles.segment}>
            <SegmentedControl<Mode>
              value={mode}
              onChange={(next) => {
                if (next === mode) return;
                confirmDiscard(() => {
                  setReceipts([]);
                  setMode(next);
                });
              }}
              options={[
                { value: 'manual', label: t('capture.manual'), icon: 'manual' },
                { value: 'scan', label: t('capture.scan'), icon: 'scan' },
              ]}
            />
          </View>

          {mode === 'manual' ? (
            <ManualExpenseForm onSaved={() => finish(1)} />
          ) : (
            <CameraStep
              batch={batch}
              onBatchChange={setBatch}
              receipts={receipts}
              onAdd={addReceipts}
              onRemove={removeReceipt}
              onReview={() => {
                setReviewIndex(0);
                setStep('review');
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

// ---------- Câmera ----------

function CameraStep({
  batch,
  onBatchChange,
  receipts,
  onAdd,
  onRemove,
  onReview,
}: {
  batch: boolean;
  onBatchChange: (batch: boolean) => void;
  receipts: PickedReceipt[];
  onAdd: (receipts: PickedReceipt[]) => void;
  onRemove: (key: string) => void;
  onReview: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const showError = useErrorAlert();
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

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady || shooting || full) return;
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
    <View style={{ flex: 1 }}>
      {/* Visor */}
      <View style={[styles.viewfinder, { backgroundColor: colors.mediaBackground }]}>
        {permission?.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              flash={flash ? 'on' : 'off'}
              onCameraReady={() => setCameraReady(true)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={flash ? t('capture.flashOff') : t('capture.flashOn')}
              accessibilityState={{ selected: flash }}
              onPress={() => setFlash((value) => !value)}
              style={[styles.flash, { backgroundColor: flash ? colors.primary : colors.mediaScrim }]}>
              <Icon name={flash ? 'flashOn' : 'flashOff'} size={20} color={flash ? colors.onPrimary : colors.onMedia} />
            </Pressable>
          </>
        ) : permission ? (
          <CameraPermissionPrompt
            canAskAgain={permission.canAskAgain}
            onContinue={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
          />
        ) : (
          <ActivityIndicator color={colors.onMedia} style={{ flex: 1 }} />
        )}
      </View>

      {/* Miniaturas do lote */}
      {batch ? (
        <View style={styles.strip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
            {receipts.map((receipt, index) => (
              <Thumbnail key={receipt.key} receipt={receipt} index={index} onRemove={() => onRemove(receipt.key)} />
            ))}
            {receipts.length === 0 ? (
              <AppText variant="caption" tone="secondary" style={{ alignSelf: 'center' }}>
                {t('capture.batchLimit', { count: RECEIPT_BATCH_LIMIT })}
              </AppText>
            ) : null}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('capture.review')}
            accessibilityState={{ disabled: receipts.length === 0 }}
            disabled={receipts.length === 0}
            onPress={onReview}
            style={[styles.reviewButton, { backgroundColor: colors.primary, opacity: receipts.length === 0 ? 0.4 : 1 }]}>
            <Icon name="arrowRight" size={22} color={colors.onPrimary} />
            {receipts.length > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.textPrimary }]}>
                <AppText variant="caption" color={colors.background}>
                  {receipts.length}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      ) : null}

      {/* Controles */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
        <ControlButton icon="gallery" label={t('capture.attach')} onPress={() => setAttaching(true)} disabled={full} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('capture.shutter')}
          accessibilityState={{ disabled: !cameraReady || shooting || full }}
          disabled={!cameraReady || shooting || full}
          onPress={takePicture}
          style={({ pressed }) => [
            styles.shutter,
            { borderColor: colors.borderStrong, opacity: !cameraReady || full ? 0.4 : pressed ? 0.7 : 1 },
          ]}>
          {shooting ? <ActivityIndicator color={colors.primary} /> : <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />}
        </Pressable>
        <ControlButton
          icon="multiple"
          label={batch ? t('capture.batchOff') : t('capture.batchOn')}
          onPress={toggleBatch}
          active={batch}
          // Com fotos no lote, sair do modo apagaria o trabalho: revise ou remova antes.
          disabled={batch && receipts.length > 0}
        />
      </View>

      <ActionSheet
        visible={attaching}
        onClose={() => setAttaching(false)}
        items={[
          {
            key: 'gallery',
            icon: 'gallery',
            label: t('capture.fromGallery'),
            onPress: attachFrom(() => pickImages(batch ? room : 1)),
          },
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

/** Pré-permissão: explica o motivo antes do diálogo do sistema (ou leva às configurações). */
function CameraPermissionPrompt({ canAskAgain, onContinue }: { canAskAgain: boolean; onContinue: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.permission}>
      <View style={[styles.permissionIcon, { backgroundColor: colors.secondary }]}>
        <Icon name="camera" size={36} color={colors.onSecondary} />
      </View>
      <AppText variant="title" color={colors.onMedia} style={{ textAlign: 'center' }}>
        {t('capture.takePhotoTitle')}
      </AppText>
      <AppText color={colors.onMediaSecondary} style={{ textAlign: 'center' }}>
        {canAskAgain ? t('capture.cameraPermissionHint') : t('capture.cameraDenied')}
      </AppText>
      <Button title={canAskAgain ? t('capture.continue') : t('capture.openSettings')} onPress={onContinue} style={{ marginTop: 8 }} />
    </View>
  );
}

function ControlButton({
  icon,
  label,
  onPress,
  active = false,
  disabled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.control,
        { backgroundColor: active ? colors.primarySurface : colors.surfaceElevated, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <Icon name={icon} size={24} color={active ? colors.primaryText : colors.textPrimary} />
    </Pressable>
  );
}

function Thumbnail({ receipt, index, onRemove }: { receipt: PickedReceipt; index: number; onRemove: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={t('capture.thumbnail', { index: index + 1 })} style={[styles.thumb, { backgroundColor: colors.surfaceElevated }]}>
      {isPdf(receipt.mimeType) ? (
        <Icon name="pdf" size={24} color={colors.primaryText} />
      ) : (
        <Image source={{ uri: receipt.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('capture.remove')} ${index + 1}`}
        onPress={onRemove}
        hitSlop={10}
        style={[styles.thumbRemove, { backgroundColor: colors.textPrimary }]}>
        <Icon name="close" size={10} color={colors.background} />
      </Pressable>
    </View>
  );
}

/** Dica mostrada na primeira vez que o modo "vários comprovantes" é ligado. */
function BatchTip({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.tipArt, { backgroundColor: colors.secondary }]}>
        {[0, 1, 2].map((slot) => (
          <View key={slot} style={[styles.tipReceipt, slot === 1 && styles.tipReceiptCenter, { backgroundColor: colors.secondarySurface }]}>
            <Icon name="receipt" size={slot === 1 ? 32 : 24} color={colors.secondary} />
          </View>
        ))}
      </View>
      <View style={{ gap: 8, paddingHorizontal: 8, paddingTop: 20 }}>
        <AppText variant="title">{t('capture.batchTipTitle')}</AppText>
        <AppText tone="secondary">{t('capture.batchTipText')}</AppText>
        <Button title={t('capture.gotIt')} onPress={onClose} style={{ marginTop: 12 }} />
      </View>
    </BottomSheet>
  );
}

// ---------- Revisão ----------

function ReviewStep({
  receipts,
  index,
  onIndexChange,
  onBack,
  onRemove,
  onRegistered,
}: {
  receipts: PickedReceipt[];
  index: number;
  onIndexChange: (index: number) => void;
  onBack: () => void;
  onRemove: (key: string) => void;
  onRegistered: (count: number) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const showError = useErrorAlert();
  const { registerAll, isRegistering } = useReceiptCapture();

  const total = receipts.length;
  const current = receipts[Math.min(index, total - 1)];
  if (!current) return null;

  const create = async () => {
    try {
      const result = await registerAll(receipts);
      if (result.failed.length > 0) Alert.alert(t('capture.partialFailure', { count: result.failed.length }));
      onRegistered(result.created.length);
    } catch (error) {
      showError(error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={onBack} hitSlop={12} style={styles.headerButton}>
          <Icon name="chevronLeft" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="title" accessibilityRole="header">
            {t('capture.reviewTitle')}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {t('capture.reviewPosition', { current: index + 1, total })}
          </AppText>
        </View>
        {total > 1 ? (
          <View style={styles.pager}>
            <PagerButton icon="chevronLeft" label={t('capture.previous')} disabled={index === 0} onPress={() => onIndexChange(index - 1)} />
            <PagerButton icon="chevronRight" label={t('capture.next')} disabled={index >= total - 1} onPress={() => onIndexChange(index + 1)} />
          </View>
        ) : null}
      </View>

      <View style={[styles.preview, { backgroundColor: colors.mediaBackground }]}>
        {isPdf(current.mimeType) ? (
          <View style={styles.pdf}>
            <Icon name="pdf" size={56} color={colors.onMedia} />
            <AppText variant="heading" color={colors.onMedia} style={{ textAlign: 'center' }} numberOfLines={2}>
              {current.name ?? t('capture.pdf')}
            </AppText>
          </View>
        ) : (
          <Image
            key={current.key}
            source={{ uri: current.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityLabel={t('capture.thumbnail', { index: index + 1 })}
          />
        )}
      </View>

      <View style={styles.ocrPromise}>
        <Icon name="sparkles" size={18} color={colors.primaryText} />
        <AppText tone="secondary" style={{ flex: 1 }}>
          {t('capture.ocrPromise')}
        </AppText>
      </View>

      <View style={[styles.reviewActions, { paddingBottom: insets.bottom + 12 }]}>
        <Button title={t('capture.remove')} variant="secondary" disabled={isRegistering} onPress={() => onRemove(current.key)} />
        <Button title={t('capture.create', { count: total })} loading={isRegistering} onPress={create} />
      </View>
    </View>
  );
}

function PagerButton({ icon, label, disabled, onPress }: { icon: IconName; label: string; disabled: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={[styles.pagerButton, { backgroundColor: colors.surfaceElevated, opacity: disabled ? 0.4 : 1 }]}>
      <Icon name={icon} size={18} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 56 },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  segment: { paddingHorizontal: 20, paddingBottom: 12 },
  viewfinder: { flex: 1, marginHorizontal: 12, borderRadius: radius.lg, overflow: 'hidden' },
  flash: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  permissionIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 12, paddingRight: 20, paddingTop: 12 },
  stripContent: { gap: 8, paddingVertical: 4, minHeight: 80, flexGrow: 1 },
  thumb: { width: 56, height: 72, borderRadius: radius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  reviewButton: { width: sizes.fab, height: sizes.fab, borderRadius: sizes.fab / 2, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 16 },
  control: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31 },
  tipArt: { height: 168, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  tipReceipt: { width: 64, height: 88, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', opacity: 0.85 },
  tipReceiptCenter: { width: 84, height: 116, opacity: 1 },
  preview: { flex: 1, marginHorizontal: 12, borderRadius: radius.lg, overflow: 'hidden' },
  pdf: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  pager: { flexDirection: 'row', gap: 8 },
  pagerButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  ocrPromise: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 16 },
  reviewActions: { gap: 10, paddingHorizontal: 20, paddingTop: 16 },
});
