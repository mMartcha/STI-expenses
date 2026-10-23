import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/presentation/components';
import { useExpense } from '@/presentation/hooks/queries';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

/** Comprovante em tela cheia, com zoom por pinça (iOS) via ScrollView. */
export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: expense } = useExpense(id);

  return (
    <View style={[styles.screen, { backgroundColor: colors.mediaBackground }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} maximumZoomScale={4} minimumZoomScale={1} centerContent>
        {expense?.receipt ? (
          <Image source={{ uri: expense.receipt.localUri }} style={styles.image} contentFit="contain" accessibilityLabel={t('expenses.receipt')} />
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button title={t('common.close')} variant="secondary" onPress={() => router.back()} />
      </View>
    </View>
  );
}
