import { Pressable, StyleSheet, View } from 'react-native';

import { radius, useTheme } from '../theme/theme';
import { Icon, type IconName } from './Icon';
import { AppText } from './ui';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

/**
 * Alternância entre modos da mesma tela (ex.: Manual | Escanear). A opção ativa ganha
 * fundo elevado e ícone na cor da marca; as demais ficam neutras.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.item,
              { backgroundColor: selected ? colors.surfaceElevated : 'transparent', opacity: pressed ? 0.8 : 1 },
            ]}>
            {option.icon ? <Icon name={option.icon} size={18} color={selected ? colors.primary : colors.textSecondary} /> : null}
            <AppText variant="button" color={selected ? colors.textPrimary : colors.textSecondary}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  item: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
