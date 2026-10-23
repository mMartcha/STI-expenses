import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryTimeline, LoadingState } from '@/presentation/components';
import { useReportDetails } from '@/presentation/hooks/queries';

import { styles } from './styles';

export default function ReportHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data } = useReportDetails(id);

  if (!data) return <LoadingState />;

  const describeTarget = (targetId: string) => {
    const expense = data.expenses.find((candidate) => candidate.id === targetId);
    return expense ? expense.description || expense.merchant?.name || null : null;
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
      <HistoryTimeline
        entries={data.report.history}
        currency={data.report.currency}
        describeTarget={describeTarget}
        submittedAt={data.report.submittedAt}
      />
    </ScrollView>
  );
}
