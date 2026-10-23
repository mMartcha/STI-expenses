import { View } from 'react-native';

import { textStyle, useTheme } from '../../theme/theme';
import type { PillProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { pillPalette, styles } from './styles';

/** Selo de status (categoria, envio, aprovação…). */
export function Pill({ label, tone = 'neutral', icon }: PillProps) {
  const { colors } = useTheme();
  const { bg, fg } = pillPalette(colors)[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} /> : null}
      <AppText variant="caption" color={fg} style={{ fontFamily: textStyle('label').fontFamily }}>
        {label}
      </AppText>
    </View>
  );
}
