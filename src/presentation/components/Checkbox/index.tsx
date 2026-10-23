import { View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { CheckboxProps } from '../../types/component.types';
import { Icon } from '../Icon';
import { styles } from './styles';

/** Caixa de seleção visual; o papel de acessibilidade fica na linha que a contém. */
export function Checkbox({ checked }: CheckboxProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.box, { borderColor: checked ? colors.primary : colors.fieldBorder, backgroundColor: checked ? colors.primary : 'transparent' }]}>
      {checked ? <Icon name="check" size={14} color={colors.onPrimary} /> : null}
    </View>
  );
}
