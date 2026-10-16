import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';

import { HistoryTimeline } from '@/presentation/components/HistoryTimeline';
import { useReportDetails } from '@/presentation/hooks/queries';
import { useTheme } from '@/presentation/theme/theme';

export default function ReportHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data } = useReportDetails(id);

  if (!data) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;

  const describeTarget = (targetId: string) => {
    const expense = data.expenses.find((candidate) => candidate.id === targetId);
    return expense ? expense.description || expense.merchant?.name || null : null;
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <HistoryTimeline
        entries={data.report.history}
        currency={data.report.currency}
        describeTarget={describeTarget}
        submittedAt={data.report.submittedAt}
      />
    </ScrollView>
  );
}
