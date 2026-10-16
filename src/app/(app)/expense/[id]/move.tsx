import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/presentation/components/Icon';
import { AppText, Button, EmptyState, Pill } from '@/presentation/components/ui';
import { useReports, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useErrorAlert } from '@/presentation/hooks/useAsyncAction';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate } from '@/presentation/utils/format';
import { REPORT_STATUS_TONE } from '@/presentation/utils/status';

/** Escolhe o relatório (rascunho ou enviado) para onde a despesa avulsa vai. */
export default function MoveToReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data = [], isLoading } = useReports(['DRAFT', 'SUBMITTED']);
  const { attachExpensesToReportUseCase } = useDependencies();
  const showError = useErrorAlert();
  const attach = useUseCaseMutation(attachExpensesToReportUseCase.execute.bind(attachExpensesToReportUseCase));

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, gap: 10 }}
      data={data}
      keyExtractor={(item) => item.report.id}
      renderItem={({ item: { report } }) => (
        <Pressable
          accessibilityRole="button"
          disabled={attach.isPending}
          onPress={() =>
            attach.mutate({ reportId: report.id, expenseIds: [id] }, { onSuccess: () => router.back(), onError: showError })
          }
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
          ]}>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="heading">{report.title}</AppText>
            <AppText variant="caption" tone="secondary">
              {t('reports.period', { start: formatDate(report.startDate), end: formatDate(report.endDate) })}
            </AppText>
            <Pill tone={REPORT_STATUS_TONE[report.status]} label={t(`reports.status.${report.status}`)} />
          </View>
          <Icon name="chevronRight" color={colors.textTertiary} />
        </Pressable>
      )}
      ListEmptyComponent={
        isLoading ? null : (
          <View style={{ gap: 16 }}>
            <EmptyState icon="report" title={t('expenses.noEditableReports')} />
            <Button title={t('reports.new')} icon="add" onPress={() => router.replace('/report/new')} />
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
});
