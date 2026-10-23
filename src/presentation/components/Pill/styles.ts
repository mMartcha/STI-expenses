import { StyleSheet } from 'react-native';

import { radius, type ThemeColors } from '../../theme/theme';
import type { PillTone } from '../../types/component.types';

export const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
});

/** Fundo suave + texto legível de cada tom. */
export function pillPalette(colors: ThemeColors): Record<PillTone, { bg: string; fg: string }> {
  return {
    neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
    primary: { bg: colors.primarySurface, fg: colors.primaryText },
    success: { bg: colors.successSurface, fg: colors.success },
    warning: { bg: colors.warningSurface, fg: colors.warning },
    error: { bg: colors.errorSurface, fg: colors.error },
    info: { bg: colors.infoSurface, fg: colors.info },
  };
}
