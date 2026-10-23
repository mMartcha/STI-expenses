import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, NoticeRow } from '@/presentation/components';
import { useNotices, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useOpenNotice } from '@/presentation/hooks/useOpenNotice';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useTheme } from '@/presentation/theme/theme';

import { styles } from './styles';

/** Avisos do sino: decisões do gestor, notas ilegíveis e falhas de envio. */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, isLoading } = useNotices();
  const { markNoticesSeenUseCase } = useDependencies();
  const markSeen = useUseCaseMutation(() => markNoticesSeenUseCase.execute());
  const openNotice = useOpenNotice();
  const notices = data?.notices ?? [];

  // Ao sair da tela os eventos ficam como lidos (o destaque "Novo" aparece só nesta visita).
  useFocusEffect(
    useCallback(() => {
      return () => markSeen.mutate(undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
      {notices.length === 0 ? (
        isLoading ? null : <EmptyState icon="bell" title={t('notices.empty')} />
      ) : (
        <Card style={styles.list}>
          {notices.map((notice) => (
            <NoticeRow key={notice.id} notice={notice} detailed onPress={() => openNotice(notice)} />
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
