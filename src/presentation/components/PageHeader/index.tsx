import { View } from 'react-native';

import type { PageHeaderProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { IconButton } from '../IconButton';
import { styles } from './styles';

/** Cabeçalho próprio (telas sem cabeçalho nativo): fechar/voltar, título, subtítulo e ações. */
export function PageHeader({ title, subtitle, leading, right }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      {leading ? <IconButton icon={leading.icon} accessibilityLabel={leading.accessibilityLabel} onPress={leading.onPress} iconSize={22} /> : null}
      <View style={styles.titles}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="secondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}
