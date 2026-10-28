import { View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { RowProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { styles } from './styles';

/** Par rótulo → valor (totais, resumos). */
export function Row({ label, value, icon, strong, valueColor }: RowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.label}>
        {icon ? <Icon name={icon} size={18} color={colors.textSecondary} /> : null}
        <AppText tone={strong ? 'primary' : 'secondary'} variant={strong ? 'heading' : 'body'}>
          {label}
        </AppText>
      </View>
      <AppText variant={strong ? 'heading' : 'body'} color={valueColor} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}
