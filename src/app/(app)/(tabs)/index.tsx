import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { endOfDayIso, startOfDayIso, toDateKey } from '@/domain/shared/dates';
import { Money } from '@/domain/shared/Money';
import { ExpenseRow } from '@/presentation/components/ExpenseRow';
import { Icon } from '@/presentation/components/Icon';
import { SyncBanner } from '@/presentation/components/SyncBanner';
import { AppText, Notice } from '@/presentation/components/ui';
import { useExpenses, useNotices } from '@/presentation/hooks/queries';
import { useFeedbackStore } from '@/presentation/stores/feedbackStore';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { font, useTheme } from '@/presentation/theme/theme';
import { formatMoney } from '@/presentation/utils/format';

const RECENT_LIMIT = 3;
const REGISTERED_NOTICE_MS = 4000;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((state) => state.user);
  const registeredAt = useFeedbackStore((state) => state.registeredAt);
  const clearRegistered = useFeedbackStore((state) => state.clearRegistered);

  const today = toDateKey(new Date());
  const { data: expenses = [], refetch, isRefetching } = useExpenses({ from: startOfDayIso(today), to: endOfDayIso(today) });
  const { data: notices } = useNotices();
  const total = useMemo(() => Money.sum(expenses.map((expense) => expense.total)), [expenses]);

  const firstName = user?.name.split(' ')[0] ?? '';
  const initial = (firstName.charAt(0) || '?').toUpperCase();

  // Confirmação de "despesa registrada" vinda da tela de captura; some sozinha.
  useEffect(() => {
    if (!registeredAt) return;
    const timer = setTimeout(clearRegistered, REGISTERED_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [registeredAt, clearRegistered]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 120, paddingHorizontal: 20 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
      {/* Topo: avatar (perfil) e sino (avisos) */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.openProfile')}
          onPress={() => router.push('/profile')}
          style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <AppText color={colors.onPrimary} style={{ fontSize: 16, ...font('700') }}>
            {initial}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.openNotices')}
          onPress={() => router.push('/notifications')}
          style={[styles.bell, { backgroundColor: colors.surface }]}>
          <Icon name="bell" size={18} color={colors.textSecondary} />
          {notices?.hasAttention ? <View style={[styles.dot, { backgroundColor: colors.primary, borderColor: colors.background }]} /> : null}
        </Pressable>
      </View>

      {/* Saudação */}
      <View style={styles.greeting}>
        <AppText color={colors.primary} style={styles.greetingText}>
          {t('home.greeting', { name: firstName })}
        </AppText>
        <AppText style={styles.greetingText}>{t('home.question')}</AppText>
      </View>

      {/* Ação principal: abre a câmera (galeria e arquivos ficam lá como opções secundárias) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('home.register')}. ${t('home.registerHint')}`}
        onPress={() => router.push('/capture')}
        style={({ pressed }) => [
          styles.register,
          { backgroundColor: pressed ? colors.primaryLight : colors.primarySurface, borderColor: colors.primaryBorder },
        ]}>
        <View style={[styles.registerIcon, { backgroundColor: colors.primary }]}>
          <Icon name="camera" size={30} color={colors.onPrimary} />
        </View>
        <View style={{ gap: 4, alignItems: 'center' }}>
          <AppText style={{ fontSize: 22, ...font('700') }}>{t('home.register')}</AppText>
          <AppText variant="caption" tone="secondary">
            {t('home.registerHint')}
          </AppText>
        </View>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => router.push('/expense/new')} style={styles.noReceipt} hitSlop={8}>
        <Icon name="manual" size={16} color={colors.primary} />
        <AppText variant="label" color={colors.primary}>
          {t('home.noReceipt')}
        </AppText>
      </Pressable>

      <View style={{ marginTop: 8, gap: 8 }}>
        {registeredAt ? <Notice tone="success" icon="check" text={t('home.registered')} /> : null}
        <SyncBanner />
      </View>

      {/* Resumo do dia */}
      <View style={styles.todayHeader}>
        <View>
          <AppText variant="label" tone="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('home.today')}
          </AppText>
          <AppText style={{ fontSize: 22, ...font('700'), fontVariant: ['tabular-nums'] }}>
            {formatMoney(total.amount, total.currency)}
          </AppText>
        </View>
        {expenses.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/expenses')} hitSlop={8}>
            <AppText variant="label" color={colors.primary}>
              {t('home.seeAll')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <View style={{ gap: 8 }}>
        {expenses.slice(0, RECENT_LIMIT).map((expense) => (
          <ExpenseRow key={expense.id} expense={expense} />
        ))}
        {expenses.length === 0 ? (
          <AppText tone="secondary" variant="caption">
            {t('home.nothingToday')}
          </AppText>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  bell: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 4, right: 5, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  greeting: { marginTop: 56, marginBottom: 40 },
  greetingText: { fontSize: 30, lineHeight: 38, ...font('700') },
  register: { minHeight: 200, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  registerIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  noReceipt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, marginBottom: 12 },
});
