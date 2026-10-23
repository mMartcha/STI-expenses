import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/presentation/components/ui';
import { useTheme } from '@/presentation/theme/theme';
import { useExpense } from '@/presentation/hooks/queries';

/** Comprovante em tela cheia, com zoom por pinça (iOS) via ScrollView. */
export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data: expense } = useExpense(id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.mediaBackground }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        maximumZoomScale={4}
        minimumZoomScale={1}
        centerContent>
        {expense?.receipt ? (
          <Image
            source={{ uri: expense.receipt.localUri }}
            style={{ flex: 1, minHeight: 400 }}
            contentFit="contain"
            accessibilityLabel={t('expenses.receipt')}
          />
        ) : null}
      </ScrollView>
      <View style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        <Button title={t('common.close')} variant="secondary" onPress={() => router.back()} />
      </View>
    </View>
  );
}
