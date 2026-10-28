import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toDateKey } from '@/domain/shared/dates';
import { AppText, CreateActions, SegmentedControl } from '@/presentation/components';
import { useTheme } from '@/presentation/theme/theme';
import { haptics } from '@/presentation/utils/haptics';

import { DayPage } from './DayPage';
import { styles } from './styles';
import { WeekPage } from './WeekPage';

type ViewMode = 'day' | 'week';

const PAGES: readonly ViewMode[] = ['day', 'week'];

/**
 * Despesas por dia ou por semana. Título e abas ficam fixos; cada visão é uma página do
 * `PagerView`, trocada pela aba ou arrastando para o lado, e guarda a própria rolagem.
 */
export default function ExpensesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const pager = useRef<PagerView>(null);
  const today = toDateKey(new Date());

  const [mode, setMode] = useState<ViewMode>('day');
  // A semana só busca as despesas quando o usuário chega nela; depois fica montada.
  const [weekVisited, setWeekVisited] = useState(false);

  const show = (next: ViewMode) => {
    setMode(next);
    if (next === 'week') setWeekVisited(true);
  };

  // Toque na aba (ela mesma já vibra): desliza o pager até a página.
  const select = (next: ViewMode) => {
    show(next);
    const index = PAGES.indexOf(next);
    if (reduceMotion) pager.current?.setPageWithoutAnimation(index);
    else pager.current?.setPage(index);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top + 16 }]}>
        <AppText variant="title" accessibilityRole="header">
          {t('tabs.expenses')}
        </AppText>
        <SegmentedControl<ViewMode>
          value={mode}
          onChange={select}
          options={[
            { value: 'day', label: t('expenses.dayView') },
            { value: 'week', label: t('expenses.weekView') },
          ]}
        />
      </View>

      <PagerView
        ref={pager}
        style={styles.pager}
        initialPage={0}
        // Começou a arrastar: já carrega a semana, para ela não aparecer vazia ao chegar.
        onPageScrollStateChanged={(event) => {
          if (event.nativeEvent.pageScrollState === 'dragging') setWeekVisited(true);
        }}
        onPageSelected={(event) => {
          const next = PAGES[event.nativeEvent.position];
          // Só o arrasto chega aqui com outra página; o toque na aba já atualizou (e vibrou).
          if (next && next !== mode) {
            haptics.selection();
            show(next);
          }
        }}>
        <View key="day" style={styles.page}>
          <DayPage today={today} />
        </View>
        <View key="week" style={styles.page}>
          {weekVisited ? <WeekPage today={today} /> : null}
        </View>
      </PagerView>

      <CreateActions />
    </View>
  );
}
