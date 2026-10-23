import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { RECEIPT_BATCH_LIMIT } from '@/domain/usecases/expense/CaptureReceiptBatchUseCase';

import { sizes, useStyles, useTheme } from '../../theme/theme';
import type { ReceiptStripProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { ReceiptThumbnail } from '../expense/ReceiptThumbnail';
import { IconButton } from '../IconButton';
import { createStyles } from './styles';

/** Miniaturas do lote (com remover) e o botão → que leva à revisão, com a contagem. */
export function ReceiptStrip({ receipts, onRemove, onReview }: ReceiptStripProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);

  return (
    <View style={styles.strip}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
        {receipts.map((receipt, index) => (
          <View key={receipt.key} style={styles.thumb} accessible accessibilityLabel={t('capture.thumbnail', { index: index + 1 })}>
            <ReceiptThumbnail receipt={receipt} size="md" />
            <IconButton
              icon="close"
              accessibilityLabel={`${t('capture.remove')} ${index + 1}`}
              size={18}
              iconSize={10}
              color={colors.background}
              onPress={() => onRemove(receipt.key)}
              style={styles.thumbRemove}
            />
          </View>
        ))}
        {receipts.length === 0 ? (
          <AppText variant="caption" tone="secondary" style={styles.stripHint}>
            {t('capture.batchLimit', { count: RECEIPT_BATCH_LIMIT })}
          </AppText>
        ) : null}
      </ScrollView>
      <View>
        <IconButton
          icon="arrowRight"
          variant="primary"
          size={sizes.fab}
          iconSize={22}
          accessibilityLabel={t('capture.review')}
          disabled={receipts.length === 0}
          onPress={onReview}
        />
        {receipts.length > 0 ? (
          <View style={styles.badge} pointerEvents="none">
            <AppText variant="caption" color={colors.background}>
              {receipts.length}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}
