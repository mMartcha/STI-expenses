import { TextInput, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { TextFieldProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { styles } from './styles';

/** Campo com rótulo, contorno (raio 8) e mensagem de erro ou dica embaixo. */
export function TextField({ label, error, hint, style, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel={label}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          { color: colors.textPrimary, backgroundColor: colors.surfaceMuted, borderColor: error ? colors.error : colors.fieldBorder },
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="tertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
