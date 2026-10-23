import { Pressable } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { TextLinkProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { styles } from './styles';

/** Ação curta em texto na cor da marca ("Ver todas", "+ Adicionar item"). */
export function TextLink({ label, onPress, icon, accessibilityLabel }: TextLinkProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.link, { opacity: pressed ? 0.7 : 1 }]}>
      {icon ? <Icon name={icon} size={16} color={colors.primaryText} /> : null}
      <AppText variant="label" tone="brand">
        {label}
      </AppText>
    </Pressable>
  );
}
