import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { isPdf } from '@/domain/gateways/ReceiptStorage';

import { useStyles, useTheme } from '../../theme/theme';
import type { ReceiptThumbnailProps } from '../../types/component.types';
import { Icon } from '../Icon';
import { createStyles, THUMBNAIL_SIZES } from './styles';

/**
 * Miniatura do comprovante: a foto, um ícone de PDF ou, sem comprovante, `placeholderIcon`
 * (padrão: despesa manual; a lista usa o ícone da categoria). Mesma peça na lista, na faixa da
 * captura e no detalhe.
 */
export function ReceiptThumbnail({ receipt, size = 'sm', placeholderIcon = 'manual', onPress, accessibilityLabel }: ReceiptThumbnailProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const box = THUMBNAIL_SIZES[size];
  const uri = receipt ? ('localUri' in receipt ? receipt.localUri : receipt.uri) : null;

  const thumbnail = (
    <View style={[styles.thumbnail, { width: box.width, height: box.height, borderRadius: box.radius }]}>
      {!receipt ? (
        <Icon name={placeholderIcon} size={box.icon} color={colors.primaryText} />
      ) : isPdf(receipt.mimeType) ? (
        <Icon name="pdf" size={box.icon} color={colors.primaryText} />
      ) : (
        <Image source={{ uri: uri! }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
    </View>
  );

  if (!onPress) return thumbnail;
  return (
    <Pressable
      accessibilityRole={receipt && !isPdf(receipt.mimeType) ? 'imagebutton' : 'button'}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      {thumbnail}
    </Pressable>
  );
}
