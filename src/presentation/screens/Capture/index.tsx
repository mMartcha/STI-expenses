import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RECEIPT_BATCH_LIMIT } from '@/domain/usecases/expense/CaptureReceiptBatchUseCase';
import { CameraStep, ManualExpenseForm, PageHeader, ReviewStep, SegmentedControl } from '@/presentation/components';
import type { PickedReceipt } from '@/presentation/hooks/useReceiptCapture';
import { useConfirm } from '@/presentation/providers/DialogProvider';
import { useToast } from '@/presentation/providers/ToastProvider';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

type Mode = 'scan' | 'manual';
type Step = 'camera' | 'review';

/**
 * Criar despesa. Duas abas na mesma tela:
 * - Escanear: câmera com galeria/arquivos e modo "vários comprovantes". Nada é gravado ao
 *   fotografar: tudo passa pela revisão ("1 de N") e só vira despesa em "Criar N despesas".
 *   O OCR roda depois, em segundo plano.
 * - Manual: despesa sem comprovante.
 *
 * Esta tela só orquestra o fluxo (estado e navegação); as peças ficam em `components/capture`.
 */
export default function CaptureScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [mode, setMode] = useState<Mode>(params.mode === 'manual' ? 'manual' : 'scan');
  const [step, setStep] = useState<Step>('camera');
  const [batch, setBatch] = useState(false);
  const [receipts, setReceipts] = useState<PickedReceipt[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const confirmDiscard = async (onDiscard: () => void) => {
    if (receipts.length === 0) return onDiscard();
    const confirmed = await confirm({
      title: t('capture.discardTitle'),
      message: t('capture.discardMessage', { count: receipts.length }),
      confirmLabel: t('capture.discard'),
      destructive: true,
    });
    if (confirmed) onDiscard();
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
    if (added.length > room) showToast(t('capture.batchLimit', { count: RECEIPT_BATCH_LIMIT }), 'info');
    setReceipts((current) => [...current, ...added.slice(0, room)]);
  };

  const removeReceipt = (key: string) => {
    const next = receipts.filter((receipt) => receipt.key !== key);
    setReceipts(next);
    if (next.length === 0) setStep('camera');
    else setReviewIndex((index) => Math.min(index, next.length - 1));
  };

  const finish = (count: number) => {
    showToast(t('home.registered', { count }), 'success');
    router.back();
  };

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    confirmDiscard(() => {
      setReceipts([]);
      setMode(next);
    });
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
          <PageHeader title={t('capture.title')} leading={{ icon: 'close', accessibilityLabel: t('common.close'), onPress: close }} />

          <View style={styles.segment}>
            <SegmentedControl<Mode>
              value={mode}
              onChange={changeMode}
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
