import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStyles, useTheme } from '../../theme/theme';
import type { BatchTipProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { BottomSheet } from '../BottomSheet';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { createStyles } from './styles';

/** Dica mostrada na primeira vez que o modo "vários comprovantes" é ligado. */
export function BatchTip({ visible, onClose }: BatchTipProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.tipArt}>
        {[0, 1, 2].map((slot) => (
          <View key={slot} style={[styles.tipReceipt, slot === 1 && styles.tipReceiptCenter]}>
            <Icon name="receipt" size={slot === 1 ? 32 : 24} color={colors.secondary} />
          </View>
        ))}
      </View>
      <View style={styles.tipBody}>
        <AppText variant="title">{t('capture.batchTipTitle')}</AppText>
        <AppText tone="secondary">{t('capture.batchTipText')}</AppText>
        <Button title={t('capture.gotIt')} onPress={onClose} style={styles.tipButton} />
      </View>
    </BottomSheet>
  );
}
