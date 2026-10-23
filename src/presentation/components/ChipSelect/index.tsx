import { Pressable, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { ChipSelectProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { styles } from './styles';

/** Escolha única entre opções curtas (categoria, forma de pagamento). */
export function ChipSelect<T extends string>({ label, options, value, onChange }: ChipSelectProps<T>) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                { backgroundColor: selected ? colors.primary : colors.surfaceMuted, borderColor: selected ? colors.primary : colors.border },
              ]}>
              <AppText variant="label" color={selected ? colors.onPrimary : colors.textPrimary}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
