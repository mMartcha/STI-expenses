import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addDays, startOfDayIso, toDateKey } from '@/domain/shared/dates';
import {
  ApprovalProgress,
  AppText,
  Avatar,
  DropdownMenu,
  Card,
  CreateActions,
  Divider,
  EmptyState,
  ExpenseRow,
  IconButton,
  NoticeRow,
  SyncBanner,
  TextLink,
  useCreateActionsClearance,
} from '@/presentation/components';
import { useExpenses, useNotices, useReports } from '@/presentation/hooks/queries';
import { useOpenNotice } from '@/presentation/hooks/useOpenNotice';
import { useSignOut } from '@/presentation/hooks/useSignOut';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { useTheme } from '@/presentation/theme/theme';
import { formatDate } from '@/presentation/utils/format';

import { styles } from './styles';

const RECENT_LIMIT = 5;
const RECENT_DAYS = 30;
/** Mesma cadência dos avisos: a aprovação chega pela sincronização em segundo plano. */
const APPROVAL_REFRESH_MS = 30_000;
const SUBMITTED: ['SUBMITTED'] = ['SUBMITTED'];

/** Saudação pelo horário local: manhã até 12h, tarde até 18h, depois noite. */
function greetingKey(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return 'home.greetingMorning' as const;
  if (hour < 18) return 'home.greetingAfternoon' as const;
  return 'home.greetingEvening' as const;
}

/**
 * Hub do app: saudação, pendências que pedem ação e despesas recentes. Criar é sempre a um
 * toque pelos botões flutuantes: câmera (escanear) e "+" (todas as formas de criar).
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const openNotice = useOpenNotice();
  const { signOut } = useSignOut();
  const user = useSessionStore((state) => state.user);
  const paddingBottom = useCreateActionsClearance();

  const now = new Date();
  const today = toDateKey(now);
  const { data: expenses = [], refetch, isRefetching } = useExpenses({ from: startOfDayIso(addDays(today, -RECENT_DAYS)) });
  const { data: notices } = useNotices();
  const { data: inReview = [] } = useReports(SUBMITTED, { refetchInterval: APPROVAL_REFRESH_MS });

  // "Adicionados recentemente" = ordem de criação, não a data da nota (que o OCR pode mudar).
  const recent = useMemo(
    () => [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, RECENT_LIMIT),
    [expenses],
  );
  const pending = useMemo(() => notices?.notices.filter((notice) => notice.requiresAction) ?? [], [notices]);
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
        {/* Topo: título da aba, avisos (sino) e perfil (avatar) */}
        <View style={styles.topBar}>
          <AppText variant="title" accessibilityRole="header">
            {t('home.title')}
          </AppText>
          <View style={styles.topActions}>
            <IconButton
              icon="bell"
              variant="filled"
              accessibilityLabel={t('home.openNotices')}
              showDot={notices?.hasAttention}
              onPress={() => router.push('/notifications')}
            />
            <DropdownMenu
              accessibilityLabel={t('home.openMenu')}
              items={[
                { key: 'profile', icon: 'person', label: t('home.menu.profile'), onPress: () => router.push('/profile') },
                { key: 'signOut', icon: 'logout', label: t('auth.signOut'), destructive: true, onPress: () => void signOut() },
              ]}>
              <Avatar name={firstName} />
            </DropdownMenu>
          </View>
        </View>

        {/* Saudação */}
        <Card style={styles.greetingCard}>
          <AppText variant="caption" tone="secondary" style={styles.capitalize}>
            {formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
          <AppText variant="display">{t(greetingKey(now), { name: firstName })}</AppText>
        </Card>

        <SyncBanner />

        {/* Pendências: o que precisa de ação do usuário */}
        <Card>
          <AppText variant="label" tone="secondary">
            {t('home.pending')}
          </AppText>
          {pending.length === 0 && inReview.length === 0 ? (
            <EmptyState appearance="illustrated" accent="secondary" icon="check" title={t('home.allClear')} hint={t('home.allClearHint')} />
          ) : (
            <View style={styles.pending}>
              {pending.map((notice) => (
                <NoticeRow key={notice.id} notice={notice} onPress={() => openNotice(notice)} />
              ))}
              {/* Relatórios com o gestor: informativos, sem ponto de pendência */}
              {inReview.map((item, index) => (
                <View key={item.report.id} style={styles.pending}>
                  {pending.length > 0 || index > 0 ? <Divider /> : null}
                  <ApprovalProgress item={item} onPress={() => router.push({ pathname: '/report/[id]', params: { id: item.report.id } })} />
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Adicionados recentemente */}
        <Card>
          <View style={styles.sectionHeader}>
            <AppText variant="heading">{t('home.recent')}</AppText>
            {recent.length > 0 ? <TextLink label={t('home.seeAll')} onPress={() => router.push('/expenses')} /> : null}
          </View>
          {recent.length === 0 ? (
            <EmptyState appearance="illustrated" icon="receipt" title={t('home.noRecent')} hint={t('home.noRecentHint')} />
          ) : (
            <View style={styles.list}>
              {recent.map((expense) => (
                <ExpenseRow key={expense.id} expense={expense} showDate />
              ))}
            </View>
          )}
        </Card>
      </ScrollView>

      <CreateActions />
    </View>
  );
}
