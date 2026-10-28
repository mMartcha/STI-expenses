import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPdf } from '@/domain/gateways/ReceiptStorage';

import { useErrorToast } from '../../hooks/useAsyncAction';
import { useReceiptCapture } from '../../hooks/useReceiptCapture';
import { useToast } from '../../providers/ToastProvider';
import { useStyles, useTheme } from '../../theme/theme';
import type { ReviewStepProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { PageHeader } from '../PageHeader';
import { createStyles } from './styles';

/** Revisão "1 de N": prévia, promessa da leitura automática, remover e "Criar N despesas". */
export function ReviewStep({ receipts, index, onIndexChange, onBack, onRemove, onRegistered }: ReviewStepProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const insets = useSafeAreaInsets();
  const showError = useErrorToast();
  const { showToast } = useToast();
  const { registerAll, isRegistering } = useReceiptCapture();

  const total = receipts.length;
  const current = receipts[Math.min(index, total - 1)];
  if (!current) return null;

  const create = async () => {
    try {
      const result = await registerAll(receipts);
      if (result.failed.length > 0) showToast(t('capture.partialFailure', { count: result.failed.length }), 'error');
      onRegistered(result.created.length);
    } catch (error) {
      showError(error);
    }
  };

  return (
    <View style={styles.flex}>
      <PageHeader
        title={t('capture.reviewTitle')}
        subtitle={t('capture.reviewPosition', { current: index + 1, total })}
        leading={{ icon: 'chevronLeft', accessibilityLabel: t('common.back'), onPress: onBack }}
        right={
          total > 1 ? (
            <>
              <IconButton
                icon="chevronLeft"
                variant="filled"
                iconSize={18}
                accessibilityLabel={t('capture.previous')}
                disabled={index === 0}
                onPress={() => onIndexChange(index - 1)}
              />
              <IconButton
                icon="chevronRight"
                variant="filled"
                iconSize={18}
                accessibilityLabel={t('capture.next')}
                disabled={index >= total - 1}
                onPress={() => onIndexChange(index + 1)}
              />
            </>
          ) : null
        }
      />

      <View style={styles.preview}>
        {isPdf(current.mimeType) ? (
          <View style={styles.pdf}>
            <Icon name="pdf" size={56} color={colors.onMedia} />
            <AppText variant="heading" color={colors.onMedia} style={styles.centered} numberOfLines={2}>
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
        <AppText tone="secondary" style={styles.ocrText}>
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
