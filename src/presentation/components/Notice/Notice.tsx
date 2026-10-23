import { View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { NoticeProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { noticePalette, styles } from './styles';

/** Faixa de aviso (sucesso, informação, atenção, erro) com ação opcional à direita. */
export function Notice({ tone, icon, text, action }: NoticeProps) {
  const { colors } = useTheme();
  const { bg, fg } = noticePalette(colors)[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg }]} accessibilityRole="alert">
      <Icon name={icon} size={18} color={fg} />
      <AppText variant="caption" style={styles.text}>
        {text}
      </AppText>
      {action}
    </View>
  );
}
