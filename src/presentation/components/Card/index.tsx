import { View } from 'react-native';

import { useStyles } from '../../theme/theme';
import type { CardProps } from '../../types/component.types';
import { createStyles } from './styles';

/** Superfície padrão (raio 20). `tone="brand"` para resumos com destaque suave de marca. */
export function Card({ children, tone = 'default', style }: CardProps) {
  const styles = useStyles(createStyles);
  return <View style={[styles.card, styles[tone], style]}>{children}</View>;
}
