import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { DateFieldProps } from '../../types/component.types';
import { formatDate } from '../../utils/format';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { styles } from './styles';

/** Campo de data nativo (compacto no iOS, diálogo no Android). */
export function DateField({ label, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
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
    <View style={styles.field}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={open}
        style={[styles.androidField, { backgroundColor: colors.surfaceMuted, borderColor: colors.fieldBorder }]}>
        <AppText>{formatDate(value, { dateStyle: 'medium' })}</AppText>
        <Icon name="calendar" color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}
