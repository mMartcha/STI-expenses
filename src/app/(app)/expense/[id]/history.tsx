import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HistoryTimeline } from '@/presentation/components/HistoryTimeline';
import { useExpense, useReportDetails } from '@/presentation/hooks/queries';
import { useTheme } from '@/presentation/theme/theme';

export default function ExpenseHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: expense } = useExpense(id);
  const { data: report } = useReportDetails(expense?.reportId ?? null);

  if (!expense) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />;

  const describeTarget = (targetId: string) =>
    expense.items.find((item) => item.id === targetId)?.description ??
    (report?.report.id === targetId ? report.report.title : null);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
      <HistoryTimeline
        entries={expense.history}
        currency={expense.currency}
        describeTarget={describeTarget}
        submittedAt={report?.report.submittedAt}
      />
    </ScrollView>
  );
}
