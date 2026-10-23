import { View } from 'react-native';

import type { RowProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { styles } from './styles';

/** Par rótulo → valor (totais, resumos). */
export function Row({ label, value, strong, valueColor }: RowProps) {
  return (
    <View style={styles.row}>
      <AppText tone={strong ? 'primary' : 'secondary'} variant={strong ? 'heading' : 'body'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'body'} color={valueColor} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}
