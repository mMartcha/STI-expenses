import { Pressable, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { ListItemProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { listItemIconPalette, styles } from './styles';

/**
 * Linha de lista: ícone num círculo, título, subtítulo e, à direita, ponto de pendência,
 * conteúdo extra e seta. Usada em menus de ações, pendências e avisos.
 */
export function ListItem({
  title,
  subtitle,
  subtitleLines = 2,
  icon,
  iconTone = 'neutral',
  showDot = false,
  showChevron,
  trailing,
  onPress,
  disabled,
  accessibilityLabel,
}: ListItemProps) {
  const { colors } = useTheme();
  const iconColors = listItemIconPalette(colors)[iconTone];
  const chevron = showChevron ?? !!onPress;

  const content = (
    <>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: iconColors.bg }]}>
          <Icon name={icon} size={20} color={iconColors.fg} />
        </View>
      ) : null}
      <View style={styles.body}>
        <AppText variant="heading" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary" numberOfLines={subtitleLines}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {showDot ? <View style={[styles.dot, { backgroundColor: colors.attention }]} /> : null}
      {chevron ? <Icon name="chevronRight" size={18} color={colors.textTertiary} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.item}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.item, { backgroundColor: pressed ? colors.surfaceMuted : 'transparent' }]}>
      {content}
    </Pressable>
  );
}
