import { View } from 'react-native';

import { sizes, useTheme } from '../../theme/theme';
import type { AvatarProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { PressableScale } from '../PressableScale';
import { styles } from './styles';

/** Inicial do usuário num círculo laranja; vira botão quando recebe `onPress`. */
export function Avatar({ name, size = sizes.avatar, onPress, accessibilityLabel }: AvatarProps) {
  const { colors } = useTheme();
  const initial = (name?.trim().charAt(0) || '?').toUpperCase();
  const style = [styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }];
  const label = (
    <AppText variant={size >= 64 ? 'title' : 'heading'} color={colors.onPrimary}>
      {initial}
    </AppText>
  );

  if (!onPress) return <View style={style}>{label}</View>;
  return (
    <PressableScale
      scale="icon"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [style, { opacity: pressed ? 0.8 : 1 }]}>
      {label}
    </PressableScale>
  );
}
