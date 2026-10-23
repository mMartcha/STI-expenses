import { ActivityIndicator, Pressable } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { ButtonProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { buttonPalette, styles } from './styles';

/** Botão em pílula (52) com variantes primary · secondary · ghost · danger. */
export function Button({ title, icon, variant = 'primary', loading = false, disabled, style, ...props }: ButtonProps) {
  const { colors } = useTheme();
  const palette = buttonPalette(colors)[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? <Icon name={icon} color={palette.text} size={18} /> : null}
          <AppText variant="button" color={palette.text}>
            {title}
          </AppText>
        </>
      )}
    </Pressable>
  );
}
