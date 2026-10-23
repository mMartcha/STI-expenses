import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryTimeline, LoadingState } from '@/presentation/components';
import { useExpense, useReportDetails } from '@/presentation/hooks/queries';

import { styles } from './styles';

export default function ExpenseHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: expense } = useExpense(id);
  const { data: report } = useReportDetails(expense?.reportId ?? null);

  if (!expense) return <LoadingState />;

  const describeTarget = (targetId: string) =>
    expense.items.find((item) => item.id === targetId)?.description ??
    (report?.report.id === targetId ? report.report.title : null);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
      <HistoryTimeline
        entries={expense.history}
        currency={expense.currency}
        describeTarget={describeTarget}
        submittedAt={report?.report.submittedAt}
      />
    </ScrollView>
  );
}
