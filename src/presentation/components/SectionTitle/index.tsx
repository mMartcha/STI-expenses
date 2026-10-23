import { View } from 'react-native';

import type { SectionTitleProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { styles } from './styles';

/** Rótulo de seção em caixa alta, com ação opcional à direita. */
export function SectionTitle({ title, right }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" tone="secondary" style={styles.title} accessibilityRole="header">
        {title}
      </AppText>
      {right}
    </View>
  );
}
