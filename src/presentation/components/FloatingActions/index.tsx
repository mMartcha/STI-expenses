import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/theme';
import type { FloatingActionsProps } from '../../types/component.types';
import { Icon, type IconName } from '../Icon';
import { styles, TAB_BAR_OVERLAY } from './styles';

/** Quanto o botão cresce enquanto está pressionado. */
const PRESSED_SCALE = 1.12;
/** Mola curta e firme: cresce rápido ao tocar e volta com um leve quique ao soltar. */
const SPRING = { damping: 14, stiffness: 320, mass: 0.6 } as const;
/** Ícones dos botões flutuantes um pouco mais firmes (2 px) que o padrão do kit (1,5 px), para contrastar no laranja. */
const FAB_ICON_STROKE = 2;

/**
 * Ações principais sempre a um toque, empilhadas no canto: escanear (a mais usada, em
 * laranja, em cima) e "+" (abre todas as formas de criar).
 */
export function FloatingActions({ onScan, onCreate }: FloatingActionsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.stack, { bottom: TAB_BAR_OVERLAY + insets.bottom + 16 }]}>
      <Fab icon="camera" label={t('home.scan')} onPress={onScan} background={colors.primary} foreground={colors.onPrimary} />
      <Fab icon="add" label={t('home.create')} onPress={onCreate} background={colors.surfaceElevated} foreground={colors.textPrimary} />
    </View>
  );
}

/**
 * Botão redondo com animação de toque: o círculo inteiro expande ao pressionar e volta ao
 * soltar. Com "reduzir movimento" ligado no aparelho, só escurece levemente.
 */
function Fab({ icon, label, onPress, background, foreground }: { icon: IconName; label: string; onPress: () => void; background: string; foreground: string }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const animateTo = (value: number) => {
    // `.set()` em vez de `.value =`: é a forma compatível com o React Compiler.
    if (!reduceMotion) scale.set(withSpring(value, SPRING));
  };

  return (
    <Animated.View style={[styles.fab, { backgroundColor: background, shadowColor: colors.shadow }, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={() => animateTo(PRESSED_SCALE)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [styles.hitArea, { opacity: reduceMotion && pressed ? 0.85 : 1 }]}>
        <Icon name={icon} size={24} color={foreground} strokeWidth={FAB_ICON_STROKE} />
      </Pressable>
    </Animated.View>
  );
}
