import { StyleSheet } from 'react-native';

import type { ThemeColors } from '../../theme/theme';
import type { IconButtonVariant } from '../../types/component.types';

export const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});

/** Fundo e cor do ícone de cada variante. */
export function iconButtonPalette(colors: ThemeColors): Record<IconButtonVariant, { background: string; icon: string }> {
  return {
    plain: { background: 'transparent', icon: colors.textPrimary },
    filled: { background: colors.surfaceElevated, icon: colors.textPrimary },
    primary: { background: colors.primary, icon: colors.onPrimary },
    brandSoft: { background: colors.primarySurface, icon: colors.primaryText },
    media: { background: colors.mediaScrim, icon: colors.onMedia },
  };
}
