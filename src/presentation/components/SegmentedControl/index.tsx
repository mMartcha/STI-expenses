import { Pressable, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { SegmentedControlProps } from '../../types/component.types';
import { haptics } from '../../utils/haptics';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { styles } from './styles';

/**
 * Alternância entre modos da mesma tela (Manual | Escanear, Dia | Semana). A opção ativa ganha
 * fundo elevado e ícone na cor da marca; as demais ficam neutras.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, size = 'md' }: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const small = size === 'sm';

  return (
    <View accessibilityRole="tablist" style={[styles.row, { backgroundColor: colors.segmentedTrack }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(option.value);
            }}
            style={({ pressed }) => [styles.item, small && styles.itemSmall, { backgroundColor: selected ? colors.surfaceElevated : 'transparent', opacity: pressed ? 0.8 : 1 }]}>
            {option.icon ? <Icon name={option.icon} size={small ? 16 : 18} color={selected ? colors.primaryText : colors.textSecondary} /> : null}
            <AppText variant={small ? 'label' : 'button'} color={selected ? colors.textPrimary : colors.textSecondary}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
