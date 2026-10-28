import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { SelectFieldProps } from '../../types/component.types';
import { haptics } from '../../utils/haptics';
import { AppText } from '../AppText';
import { BottomSheet } from '../BottomSheet';
import { Icon, type IconName } from '../Icon';
import { styles } from './styles';

/**
 * Picklist: campo fechado com o valor escolhido; ao tocar, abre a lista de opções num
 * `BottomSheet`. Com `onClear`, a lista ganha uma opção para deixar o campo sem valor.
 */
export function SelectField<T extends string>({ label, options, value, onChange, placeholder, onClear, clearLabel }: SelectFieldProps<T>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value);

  const pick = (next: () => void) => {
    next();
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder ?? t('common.select')}`}
        accessibilityHint={t('common.select')}
        onPress={() => setOpen(true)}
        style={[styles.control, { backgroundColor: colors.surfaceMuted, borderColor: colors.fieldBorder }]}>
        {current?.icon ? <Icon name={current.icon} color={colors.textSecondary} /> : null}
        <AppText color={current ? colors.textPrimary : colors.textTertiary} numberOfLines={1} style={styles.value}>
          {current?.label ?? placeholder ?? t('common.select')}
        </AppText>
        <Icon name="chevronDown" color={colors.textSecondary} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <AppText variant="subtitle" style={styles.title}>
          {label}
        </AppText>
        <ScrollView style={styles.list} accessibilityRole="radiogroup">
          {onClear ? (
            <Option label={clearLabel ?? t('common.notInformed')} selected={value === null} muted onPress={() => pick(onClear)} />
          ) : null}
          {options.map((option) => (
            <Option
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={option.value === value}
              onPress={() => {
                // Vibra no toque; a troca em si roda depois que a folha fecha.
                haptics.selection();
                pick(() => onChange(option.value));
              }}
            />
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

function Option({
  label,
  icon,
  selected,
  muted,
  onPress,
}: {
  label: string;
  icon?: IconName;
  selected: boolean;
  muted?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, { backgroundColor: selected ? colors.primarySubtle : pressed ? colors.surfaceMuted : 'transparent' }]}>
      {icon ? <Icon name={icon} color={selected ? colors.primaryText : colors.textSecondary} /> : null}
      <AppText color={muted && !selected ? colors.textSecondary : colors.textPrimary} style={styles.value}>
        {label}
      </AppText>
      {selected ? <Icon name="check" color={colors.primaryText} /> : null}
    </Pressable>
  );
}
