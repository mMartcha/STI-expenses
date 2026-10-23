import { Pressable, View } from 'react-native';

import { sizes, useTheme } from '../../theme/theme';
import type { IconButtonProps } from '../../types/component.types';
import { Icon } from '../Icon';
import { iconButtonPalette, styles } from './styles';

/**
 * Botão redondo só com ícone (fechar, voltar, setas, flash, sino…). O círculo inteiro é a
 * área de toque (mínimo 44) e o ícone fica no centro exato.
 */
export function IconButton({
  icon,
  variant = 'plain',
  size = sizes.iconButton,
  iconSize = Math.round(size * 0.45),
  color,
  showDot = false,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const { colors } = useTheme();
  const palette = iconButtonPalette(colors)[variant];

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{ ...props.accessibilityState, disabled: !!disabled }}
      disabled={disabled}
      hitSlop={props.hitSlop ?? (size < sizes.iconButton ? (sizes.iconButton - size) / 2 : undefined)}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: palette.background, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}>
      <Icon name={icon} size={iconSize} color={color ?? palette.icon} />
      {showDot ? (
        <View
          style={[
            styles.dot,
            { top: size * 0.18, right: size * 0.2, backgroundColor: colors.attention, borderColor: palette.background === 'transparent' ? colors.background : palette.background },
          ]}
        />
      ) : null}
    </Pressable>
  );
}
