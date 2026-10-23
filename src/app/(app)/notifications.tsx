import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Notice } from '@/domain/entities/Notice';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { AppText, EmptyState, Pill } from '@/presentation/components/ui';
import { useNotices, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';
import { formatDateTime } from '@/presentation/utils/format';

const ICON: Record<Notice['type'], IconName> = {
  REPORT_APPROVED: 'check',
  REPORT_REJECTED: 'warning',
  OCR_FAILED: 'receipt',
  SYNC_FAILED: 'offline',
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, isLoading } = useNotices();
  const { markNoticesSeenUseCase, retryFailedSyncUseCase } = useDependencies();
  const markSeen = useUseCaseMutation(() => markNoticesSeenUseCase.execute());
  const retrySync = useUseCaseMutation(() => retryFailedSyncUseCase.execute());

  // Ao sair da tela os eventos ficam como lidos (o destaque "Novo" aparece só nesta visita).
  useFocusEffect(
    useCallback(() => {
      return () => markSeen.mutate(undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const open = (notice: Notice) => {
    switch (notice.type) {
      case 'SYNC_FAILED':
        return retrySync.mutate(undefined);
      case 'OCR_FAILED':
        return notice.targetId && router.push({ pathname: '/expense/[id]', params: { id: notice.targetId } });
      default:
        return notice.targetId && router.push({ pathname: '/report/[id]', params: { id: notice.targetId } });
    }
  };

  const tone = (notice: Notice) =>
    notice.type === 'REPORT_APPROVED' ? colors.success : notice.type === 'REPORT_REJECTED' || notice.type === 'SYNC_FAILED' ? colors.error : colors.warning;

  return (
    <FlatList
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16, gap: 10 }}
      data={data?.notices ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const hint =
          item.type === 'OCR_FAILED' ? t('notices.OCR_FAILED_hint') : item.type === 'SYNC_FAILED' ? t('notices.SYNC_FAILED_hint') : null;
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => open(item)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border },
            ]}>
            <View style={[styles.icon, { backgroundColor: colors.primarySurface }]}>
              <Icon name={ICON[item.type]} color={tone(item)} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{t(`notices.${item.type}`, { count: Number(item.targetLabel) })}</AppText>
              {item.type !== 'SYNC_FAILED' && item.targetLabel ? (
                <AppText tone="secondary" numberOfLines={1}>
                  {item.targetLabel}
                </AppText>
              ) : null}
              {hint ? (
                <AppText variant="caption" tone="tertiary">
                  {hint}
                </AppText>
              ) : null}
              {item.type !== 'SYNC_FAILED' ? (
                <AppText variant="caption" tone="tertiary">
                  {formatDateTime(item.at)}
                </AppText>
              ) : null}
            </View>
            {item.unread && !item.requiresAction ? <Pill tone="primary" label={t('notices.new')} /> : null}
          </Pressable>
        );
      }}
      ListEmptyComponent={isLoading ? null : <EmptyState icon="bell" title={t('notices.empty')} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
