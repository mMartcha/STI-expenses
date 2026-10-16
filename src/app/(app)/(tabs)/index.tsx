import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { endOfDayIso, startOfDayIso, toDateKey } from '@/domain/shared/dates';
import { Money } from '@/domain/shared/Money';
import { ExpenseRow } from '@/presentation/components/ExpenseRow';
import { Icon, type IconName } from '@/presentation/components/Icon';
import { SyncBanner } from '@/presentation/components/SyncBanner';
import { AppText } from '@/presentation/components/ui';
import { useExpenses, useNotices } from '@/presentation/hooks/queries';
import { useReceiptCapture } from '@/presentation/hooks/useReceiptCapture';
import { useSessionStore } from '@/presentation/stores/sessionStore';
import { font, useTheme } from '@/presentation/theme/theme';
import { formatMoney } from '@/presentation/utils/format';

const RECENT_LIMIT = 3;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((state) => state.user);
  const { scan, pickFile, pickImage, paste, isProcessing } = useReceiptCapture();

  const today = toDateKey(new Date());
  const { data: expenses = [], refetch, isRefetching } = useExpenses({ from: startOfDayIso(today), to: endOfDayIso(today) });
  const { data: notices } = useNotices();
  const total = useMemo(() => Money.sum(expenses.map((expense) => expense.total)), [expenses]);

  const firstName = user?.name.split(' ')[0] ?? '';
  const initial = (firstName.charAt(0) || '?').toUpperCase();

  const actions: { key: string; icon: IconName; title: string; hint: string; onPress: () => void }[] = [
    { key: 'scan', icon: 'scan', title: t('home.scan'), hint: t('home.scanHint'), onPress: scan },
    { key: 'files', icon: 'folder', title: t('home.files'), hint: t('home.filesHint'), onPress: pickFile },
    { key: 'images', icon: 'image', title: t('home.images'), hint: t('home.imagesHint'), onPress: pickImage },
    { key: 'paste', icon: 'paste', title: t('home.paste'), hint: t('home.pasteHint'), onPress: paste },
  ];

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

      {/* Ações de captura */}
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}. ${action.hint}`}
            disabled={isProcessing}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: pressed ? colors.surfaceMuted : colors.surface, borderColor: colors.border, opacity: isProcessing ? 0.6 : 1 },
            ]}>
            <Icon name={action.icon} size={28} color={colors.primary} />
            <View style={{ gap: 4 }}>
              <AppText style={{ fontSize: 18, ...font('600') }}>{action.title}</AppText>
              <AppText variant="caption" tone="secondary" numberOfLines={1}>
                {action.hint}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>

      {isProcessing ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}

      <Pressable accessibilityRole="button" onPress={() => router.push('/expense/new')} style={styles.noReceipt} hitSlop={8}>
        <Icon name="manual" size={16} color={colors.primary} />
        <AppText variant="label" color={colors.primary}>
          {t('home.noReceipt')}
        </AppText>
      </Pressable>

      <View style={{ marginTop: 8 }}>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 150,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 22,
    justifyContent: 'space-between',
  },
  noReceipt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, marginBottom: 12 },
});
