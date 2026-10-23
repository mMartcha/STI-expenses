import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, ReportCard } from '@/presentation/components';
import { useReports, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';

import { styles } from './styles';

/** Escolhe o relatório (rascunho ou enviado) para onde a despesa avulsa vai. */
export default function MoveToReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data = [], isLoading } = useReports(['DRAFT', 'SUBMITTED']);
  const { attachExpensesToReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const attach = useUseCaseMutation(attachExpensesToReportUseCase.execute.bind(attachExpensesToReportUseCase));

  return (
    <FlatList
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      data={data}
      keyExtractor={(item) => item.report.id}
      renderItem={({ item: { report } }) => (
        <ReportCard
          report={report}
          disabled={attach.isPending}
          onPress={() => attach.mutate({ reportId: report.id, expenseIds: [id] }, { onSuccess: () => router.back(), onError: showError })}
        />
      )}
      ListEmptyComponent={
        isLoading ? null : (
          <View style={styles.empty}>
            <EmptyState icon="report" title={t('expenses.noEditableReports')} />
            <Button title={t('reports.new')} icon="add" onPress={() => router.replace('/report/new')} />
          </View>
        )
      }
    />
  );
}
