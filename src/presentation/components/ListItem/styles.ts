import { StyleSheet } from 'react-native';

import { radius, sizes, type ThemeColors } from '../../theme/theme';
import type { ListItemTone } from '../../types/component.types';

export const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: sizes.row, paddingVertical: 8, paddingHorizontal: 4, borderRadius: radius.md },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

export function listItemIconPalette(colors: ThemeColors): Record<ListItemTone, { bg: string; fg: string }> {
  return {
    neutral: { bg: colors.surfaceElevated, fg: colors.textPrimary },
    warning: { bg: colors.warningSurface, fg: colors.warning },
    brand: { bg: colors.primarySurface, fg: colors.primaryText },
    success: { bg: colors.successSurface, fg: colors.success },
    error: { bg: colors.errorSurface, fg: colors.error },
  };
}
