import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/presentation/components/Icon';
import { AppText, Button, EmptyState } from '@/presentation/components/ui';
import { useExpenses, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDateTime, formatMoney } from '@/presentation/utils/format';

/** Seleção múltipla de despesas avulsas para juntar no relatório. */
export default function AttachExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data = [], isLoading } = useExpenses({ unassignedOnly: true });
  const { attachExpensesToReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const attach = useUseCaseMutation(attachExpensesToReportUseCase.execute.bind(attachExpensesToReportUseCase));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (expenseId: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(expenseId)) next.delete(expenseId);
      else next.add(expenseId);
      return next;
    });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 8 }}
        data={data.filter((expense) => !expense.locked)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const checked = selected.has(item.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => toggle(item.id)}
              style={[
                styles.row,
                { backgroundColor: checked ? colors.primarySurface : colors.surface, borderColor: checked ? colors.primary : colors.border },
              ]}>
              <View style={[styles.check, { borderColor: checked ? colors.primary : colors.border, backgroundColor: checked ? colors.primary : 'transparent' }]}>
                {checked ? <Icon name="check" size={14} color={colors.onPrimary} /> : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="heading" numberOfLines={1}>
                  {item.description || item.merchant?.name || t('expenses.untitled')}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {t(`categories.${item.category}`)} · {formatDateTime(item.occurredAt)}
                </AppText>
              </View>
              <AppText variant="heading">{formatMoney(item.total.amount, item.currency)}</AppText>
            </Pressable>
          );
        }}
        ListEmptyComponent={isLoading ? null : <EmptyState icon="receipt" title={t('reports.noUnassigned')} />}
      />
      <View style={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        <Button
          title={t('reports.attachSelected', { count: selected.size })}
          disabled={selected.size === 0}
          loading={attach.isPending}
          onPress={() =>
            attach.mutate({ reportId: id, expenseIds: [...selected] }, { onSuccess: () => router.back(), onError: showError })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
