import { Text } from 'react-native';

import { textStyle, useTheme } from '../../theme/theme';
import type { AppTextProps } from '../../types/component.types';

/**
 * Único componente de texto do app: tamanho, altura de linha e peso vêm da escala
 * (`typography`), a cor vem do `tone` (ou de `color`, sempre um papel do tema).
 * `brand` = laranja legível como texto (`primaryText`).
 */
export function AppText({ variant = 'body', color, tone = 'primary', style, ...props }: AppTextProps) {
  const { colors } = useTheme();
  const toneColor = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    brand: colors.primaryText,
  }[tone];
  return <Text {...props} style={[textStyle(variant), { color: color ?? toneColor }, style]} />;
}
