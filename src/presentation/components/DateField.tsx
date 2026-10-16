import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { formatDate } from '../utils/format';
import { Icon } from './Icon';
import { AppText } from './ui';

/** Campo de data nativo (compacto no iOS, diálogo no Android). */
export function DateField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const { colors } = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosRow}>
        <AppText variant="label" tone="secondary">
          {label}
        </AppText>
        <DateTimePicker
          value={value}
          mode="date"
          display="compact"
          accentColor={colors.primary}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_, date) => onChange(date)}
        />
      </View>
    );
  }

  const open = () =>
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      minimumDate,
      maximumDate,
      onValueChange: (_, date) => onChange(date),
    });

  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={open}
        style={[styles.androidField, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <AppText>{formatDate(value, { dateStyle: 'medium' })}</AppText>
        <Icon name="calendar" color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  iosRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  androidField: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
