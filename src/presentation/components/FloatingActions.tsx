import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes, useTheme } from '../theme/theme';
import { Icon, type IconName } from './Icon';

/** Altura aproximada da barra de abas nativa acima da área segura (iOS sobrepõe o conteúdo). */
const TAB_BAR_OVERLAY = Platform.select({ ios: 49, default: 0 });

/** Quanto o botão cresce enquanto está pressionado. */
const PRESSED_SCALE = 1.12;
/** Mola curta e firme: cresce rápido ao tocar e volta com um leve quique ao soltar. */
const SPRING = { damping: 14, stiffness: 320, mass: 0.6 } as const;

/**
 * Ações principais sempre a um toque, empilhadas no canto: escanear (a mais usada, em
 * laranja, em cima) e "+" (abre todas as formas de criar).
 */
export function FloatingActions({ onScan, onCreate }: { onScan: () => void; onCreate: () => void }) {
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
function Fab({
  icon,
  label,
  onPress,
  background,
  foreground,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  background: string;
  foreground: string;
}) {
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
        <Icon name={icon} size={24} color={foreground} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'absolute', right: 20, gap: 12, alignItems: 'center' },
  fab: {
    width: sizes.fab,
    height: sizes.fab,
    borderRadius: sizes.fab / 2,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  /** Ocupa o círculo inteiro: área de toque = botão, e o ícone fica no centro exato. */
  hitArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: sizes.fab / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
