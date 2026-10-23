import { StyleSheet } from 'react-native';

import { radius, sizes, type ThemeColors } from '../../theme/theme';
import type { ReceiptThumbnailSize } from '../../types/component.types';

/** Lista (44×52) · faixa de captura (56×72) · detalhe da despesa (72×96). */
export const THUMBNAIL_SIZES: Record<ReceiptThumbnailSize, { width: number; height: number; radius: number; icon: number }> = {
  sm: { width: 44, height: 52, radius: radius.sm, icon: 20 },
  md: { width: 56, height: 72, radius: radius.sm, icon: 24 },
  lg: { width: 72, height: 96, radius: radius.md, icon: 28 },
};

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    thumbnail: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      minHeight: 72,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    rowBody: { flex: 1, gap: 2 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 },
    amount: { alignItems: 'flex-end', gap: 4 },
    tabular: { fontVariant: ['tabular-nums'] },
    selectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: sizes.row },
    itemBody: { flex: 1, gap: 2 },
    struck: { textDecorationLine: 'line-through', color: colors.textTertiary },
    formContent: { padding: 20, gap: 16 },
  });
