import { View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { EmptyStateProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { styles } from './styles';

/**
 * Estado vazio. `plain`: ícone solto (listas). `illustrated`: ícone num círculo colorido e
 * título maior, como "Tudo em dia" na Início.
 */
export function EmptyState({ icon, title, hint, appearance = 'plain', accent = 'brand' }: EmptyStateProps) {
  const { colors } = useTheme();

  if (appearance === 'illustrated') {
    const badge = accent === 'secondary' ? { bg: colors.secondarySurface, fg: colors.secondary } : { bg: colors.primarySurface, fg: colors.primaryText };
    return (
      <View style={styles.illustrated}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Icon name={icon} size={28} color={badge.fg} />
        </View>
        <AppText variant="title" style={styles.centered}>
          {title}
        </AppText>
        {hint ? (
          <AppText tone="secondary" style={styles.centered}>
            {hint}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.plain}>
      <Icon name={icon} size={40} color={colors.textTertiary} />
      <AppText variant="heading" style={styles.centered}>
        {title}
      </AppText>
      {hint ? (
        <AppText tone="secondary" style={styles.centered}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
