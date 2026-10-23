import { View } from 'react-native';

import { useTheme } from '../../theme/theme';
import { styles } from './styles';

/** Linha fina de separação entre blocos de um card. */
export function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}
