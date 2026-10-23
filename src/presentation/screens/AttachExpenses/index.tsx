import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, ExpenseSelectRow } from '@/presentation/components';
import { useExpenses, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';

import { styles } from './styles';

/** Seleção múltipla de despesas avulsas para juntar no relatório. */
export default function AttachExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
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
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.content}
        data={data.filter((expense) => !expense.locked)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseSelectRow expense={item} checked={selected.has(item.id)} onToggle={() => toggle(item.id)} />}
        ListEmptyComponent={isLoading ? null : <EmptyState icon="receipt" title={t('reports.noUnassigned')} />}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={t('reports.attachSelected', { count: selected.size })}
          disabled={selected.size === 0}
          loading={attach.isPending}
          onPress={() => attach.mutate({ reportId: id, expenseIds: [...selected] }, { onSuccess: () => router.back(), onError: showError })}
        />
      </View>
    </View>
  );
}
