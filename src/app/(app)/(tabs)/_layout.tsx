import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { textStyle, useTheme } from '@/presentation/theme/theme';

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
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="expenses">
        <NativeTabs.Trigger.Label>{t('tabs.expenses')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Label>{t('tabs.reports')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'folder', selected: 'folder.fill' }} md="description" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
