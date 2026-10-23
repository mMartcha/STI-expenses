import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { textStyle, useTheme } from '@/presentation/theme/theme';

/**
 * Ícones das abas: PNGs gerados dos SVGs do Stara UI Kit (home_24, file_24, reports_24), em preto
 * sobre transparente. A barra nativa pinta com `iconColor`, então seguem o tema e o estado ativo.
 */
const TAB_ICONS = {
  home: require('../../../../assets/icons/tabs/tab_home.png'),
  expenses: require('../../../../assets/icons/tabs/tab_expenses.png'),
  reports: require('../../../../assets/icons/tabs/tab_reports.png'),
} as const;

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.primaryText}
      indicatorColor={colors.primaryLight}
      iconColor={{ default: colors.textSecondary, selected: colors.primaryText }}
      labelStyle={{
        default: { color: colors.textSecondary, fontFamily: textStyle('caption').fontFamily },
        selected: { color: colors.primaryText, fontFamily: textStyle('label').fontFamily },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={TAB_ICONS.home} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="expenses">
        <NativeTabs.Trigger.Label>{t('tabs.expenses')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={TAB_ICONS.expenses} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Label>{t('tabs.reports')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={TAB_ICONS.reports} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
