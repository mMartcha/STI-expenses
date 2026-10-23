import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Notice } from '@/domain/entities/Notice';
import { addDays, startOfDayIso, toDateKey } from '@/domain/shared/dates';
import { CREATE_ACTIONS_CLEARANCE, CreateActions } from '@/presentation/components/CreateActions';
import { ExpenseRow } from '@/presentation/components/ExpenseRow';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { SyncBanner } from '@/presentation/components/SyncBanner';
import { AppText, Card, Notice as NoticeBanner } from '@/presentation/components/ui';
import { useExpenses, useNotices, useUseCaseMutation } from '@/presentation/hooks/queries';
import { useDependencies } from '@/presentation/providers/DependenciesProvider';
import { useFeedbackStore } from '@/presentation/stores/feedbackStore';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { radius, useTheme } from '@/presentation/theme/theme';
import { formatDate } from '@/presentation/utils/format';

const RECENT_LIMIT = 5;
const RECENT_DAYS = 30;
const REGISTERED_NOTICE_MS = 4000;

const PENDING_ICON: Record<Notice['type'], IconName> = {
  OCR_FAILED: 'receipt',
  SYNC_FAILED: 'offline',
  REPORT_APPROVED: 'check',
  REPORT_REJECTED: 'warning',
};

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
  const user = useSessionStore((state) => state.user);
  const registered = useFeedbackStore((state) => state.registered);
  const clearRegistered = useFeedbackStore((state) => state.clearRegistered);

  const now = new Date();
  const today = toDateKey(now);
  const { data: expenses = [], refetch, isRefetching } = useExpenses({ from: startOfDayIso(addDays(today, -RECENT_DAYS)) });
  const { data: notices } = useNotices();

  // "Adicionados recentemente" = ordem de criação, não a data da nota (que o OCR pode mudar).
  const recent = useMemo(
    () => [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, RECENT_LIMIT),
    [expenses],
  );
  const pending = useMemo(() => notices?.notices.filter((notice) => notice.requiresAction) ?? [], [notices]);

  const firstName = user?.name.split(' ')[0] ?? '';
  const initial = (firstName.charAt(0) || '?').toUpperCase();

  // Confirmação de "despesa(s) registrada(s)" vinda da tela de captura; some sozinha.
  useEffect(() => {
    if (!registered) return;
    const timer = setTimeout(clearRegistered, REGISTERED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [registered, clearRegistered]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + CREATE_ACTIONS_CLEARANCE, paddingHorizontal: 20, gap: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
        {/* Topo: título da aba, avisos (sino) e perfil (avatar) */}
        <View style={styles.topBar}>
          <AppText variant="title" accessibilityRole="header">
            {t('home.title')}
          </AppText>
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.openNotices')}
              onPress={() => router.push('/notifications')}
              hitSlop={6}
              style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}>
              <Icon name="bell" size={20} color={colors.textPrimary} />
              {notices?.hasAttention ? <View style={[styles.dot, { backgroundColor: colors.attention, borderColor: colors.surfaceElevated }]} /> : null}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.openProfile')}
              onPress={() => router.push('/profile')}
              hitSlop={6}
              style={[styles.iconButton, { backgroundColor: colors.primary }]}>
              <AppText variant="heading" color={colors.onPrimary}>
                {initial}
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* Saudação */}
        <Card style={styles.greetingCard}>
          <AppText variant="caption" tone="secondary" style={{ textTransform: 'capitalize' }}>
            {formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' })}
          </AppText>
          <AppText variant="display">{t(greetingKey(now), { name: firstName })}</AppText>
        </Card>

        {registered ? <NoticeBanner tone="success" icon="check" text={t('home.registered', { count: registered.count })} /> : null}
        <SyncBanner />

        {/* Pendências: o que precisa de ação do usuário */}
        <Card>
          <AppText variant="label" tone="secondary">
            {t('home.pending')}
          </AppText>
          {pending.length === 0 ? (
            <View style={styles.emptyBlock}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.secondarySurface }]}>
                <Icon name="check" size={28} color={colors.secondary} />
              </View>
              <AppText variant="title" style={{ textAlign: 'center' }}>
                {t('home.allClear')}
              </AppText>
              <AppText tone="secondary" style={{ textAlign: 'center' }}>
                {t('home.allClearHint')}
              </AppText>
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              {pending.map((notice) => (
                <PendingRow key={notice.id} notice={notice} />
              ))}
            </View>
          )}
        </Card>

        {/* Adicionados recentemente */}
        <Card>
          <View style={styles.sectionHeader}>
            <AppText variant="heading">{t('home.recent')}</AppText>
            {recent.length > 0 ? (
              <Pressable accessibilityRole="link" onPress={() => router.push('/expenses')} hitSlop={8}>
                <AppText variant="label" tone="brand">
                  {t('home.seeAll')}
                </AppText>
              </Pressable>
            ) : null}
          </View>
          {recent.length === 0 ? (
            <View style={styles.emptyBlock}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primarySurface }]}>
                <Icon name="receipt" size={28} color={colors.primaryText} />
              </View>
              <AppText variant="title" style={{ textAlign: 'center' }}>
                {t('home.noRecent')}
              </AppText>
              <AppText tone="secondary" style={{ textAlign: 'center' }}>
                {t('home.noRecentHint')}
              </AppText>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
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

/** Uma pendência: leva à despesa (nota ilegível) ou tenta reenviar (falha de envio). */
function PendingRow({ notice }: { notice: Notice }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { retryFailedSyncUseCase } = useDependencies();
  const retrySync = useUseCaseMutation(() => retryFailedSyncUseCase.execute());

  const open = () => {
    if (notice.type === 'SYNC_FAILED') return retrySync.mutate(undefined);
    if (notice.targetId) router.push({ pathname: '/expense/[id]', params: { id: notice.targetId } });
  };
  const hint = notice.type === 'SYNC_FAILED' ? t('notices.SYNC_FAILED_hint') : t('notices.OCR_FAILED_hint');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={open}
      style={({ pressed }) => [styles.pendingRow, { backgroundColor: pressed ? colors.surfaceMuted : 'transparent' }]}>
      <View style={[styles.pendingIcon, { backgroundColor: colors.warningSurface }]}>
        <Icon name={PENDING_ICON[notice.type]} size={18} color={colors.warning} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="heading" numberOfLines={1}>
          {t(`notices.${notice.type}`, { count: Number(notice.targetLabel) })}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {notice.type === 'OCR_FAILED' && notice.targetLabel ? notice.targetLabel : hint}
        </AppText>
      </View>
      <View style={[styles.attentionDot, { backgroundColor: colors.attention }]} />
      <Icon name="chevronRight" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  topActions: { flexDirection: 'row', gap: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 8, right: 9, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  greetingCard: { gap: 6, paddingVertical: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  emptyBlock: { alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 4, borderRadius: radius.md },
  pendingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  attentionDot: { width: 10, height: 10, borderRadius: 5 },
});
