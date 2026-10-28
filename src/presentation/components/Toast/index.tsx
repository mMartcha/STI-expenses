import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/theme';
import type { ToastProps, ToastType } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon, type IconName } from '../Icon';
import { styles } from './styles';

const ENTER_DURATION = 300;
const EXIT_DURATION = 200;

const ICONS: Record<ToastType, IconName> = { success: 'check', error: 'warning', info: 'bell' };

/**
 * Aviso curto no topo da tela (mesmo comportamento do app-stara-ai): desce com mola, some
 * sozinho após `duration` ou no ✕. As cores vêm do tema (`toastSuccess`/`toastError`/`toastInfo`).
 */
export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // `useState` com inicializador: os valores animados são criados uma vez e não são lidos como ref.
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(-100));
  const background = { success: colors.toastSuccess, error: colors.toastError, info: colors.toastInfo }[type];

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: EXIT_DURATION, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -100, duration: EXIT_DURATION, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [opacity, translateY, onClose]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: ENTER_DURATION, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(close, duration);
    return () => clearTimeout(timer);
  }, [close, duration, opacity, translateY]);

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { top: insets.top + 8, backgroundColor: background, shadowColor: colors.shadow, opacity, transform: [{ translateY }] }]}>
      <Icon name={ICONS[type]} size={20} color={colors.onToast} />
      <AppText variant="label" color={colors.onToast} numberOfLines={3} style={styles.message}>
        {message}
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={close} hitSlop={10} style={styles.close}>
        <Icon name="close" size={16} color={colors.onToast} />
      </Pressable>
    </Animated.View>
  );
}
