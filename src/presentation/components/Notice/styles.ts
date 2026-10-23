import { StyleSheet } from 'react-native';

import { radius, type ThemeColors } from '../../theme/theme';
import type { NoticeTone } from '../../types/component.types';

export const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md },
  text: { flex: 1 },
});

export function noticePalette(colors: ThemeColors): Record<NoticeTone, { bg: string; fg: string }> {
  return {
    warning: { bg: colors.warningSurface, fg: colors.warning },
    error: { bg: colors.errorSurface, fg: colors.error },
    info: { bg: colors.infoSurface, fg: colors.info },
    success: { bg: colors.successSurface, fg: colors.success },
  };
}
