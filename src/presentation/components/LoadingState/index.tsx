import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import { styles } from './styles';

/** Carregando a tela inteira (enquanto a despesa ou o relatório ainda não chegou). */
export function LoadingState() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
