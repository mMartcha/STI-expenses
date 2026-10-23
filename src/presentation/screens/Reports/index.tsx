import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, CREATE_ACTIONS_CLEARANCE, CreateActions, EmptyState, ReportCard, SyncBanner } from '@/presentation/components';
import { useReports } from '@/presentation/hooks/queries';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

/** Relatórios do usuário (rascunhos, enviados e decididos). */
export default function ReportsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data = [], isLoading, refetch, isRefetching } = useReports();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + CREATE_ACTIONS_CLEARANCE }]}
        data={data}
        keyExtractor={(item) => item.report.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="title" accessibilityRole="header">
              {t('reports.title')}
            </AppText>
            <SyncBanner />
          </View>
        }
        renderItem={({ item }) => (
          <ReportCard
            report={item.report}
            summary={item}
            onPress={() => router.push({ pathname: '/report/[id]', params: { id: item.report.id } })}
          />
        )}
        ListEmptyComponent={isLoading ? null : <EmptyState icon="report" title={t('reports.empty')} hint={t('reports.emptyHint')} />}
      />
      <CreateActions />
    </View>
  );
}
