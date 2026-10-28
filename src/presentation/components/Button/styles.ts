import { StyleSheet } from 'react-native';

import { radius, sizes, type ThemeColors } from '../../theme/theme';
import type { ButtonVariant } from '../../types/component.types';

export const styles = StyleSheet.create({
  button: {
    minHeight: sizes.control,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { flexShrink: 1, textAlign: 'center' },
});

/** Cores de cada variante: fundo, borda e texto/ícone. */
export function buttonPalette(colors: ThemeColors): Record<ButtonVariant, { background: string; border: string; text: string }> {
  return {
    primary: { background: colors.primary, border: colors.primary, text: colors.onPrimary },
    secondary: { background: colors.surfaceElevated, border: colors.surfaceElevated, text: colors.textPrimary },
    ghost: { background: 'transparent', border: 'transparent', text: colors.primaryText },
    danger: { background: 'transparent', border: colors.error, text: colors.error },
  };
}
