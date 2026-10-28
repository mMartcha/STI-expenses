import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { AppText, Card } from '@/presentation/components';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

/** Card laranja com o total do período; enquanto carrega, um spinner ocupa o lugar do valor (sem mudar a altura). */
export function TotalCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card tone="brand">
      <AppText variant="caption" tone="secondary" style={styles.centered}>
        {label}
      </AppText>
      <View style={styles.totalSlot}>
        {loading ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel={t('common.loading')} />
        ) : (
          <AppText variant="title" style={styles.total}>
            {value}
          </AppText>
        )}
      </View>
    </Card>
  );
}
