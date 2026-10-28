import { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

/** Intensidade do toque: cards encolhem mais; botões com texto, quase nada; ícones, o bastante para se notar num alvo pequeno. */
export type PressScale = 'card' | 'button' | 'icon';

const SCALES: Record<PressScale, number> = { card: 0.96, button: 0.98, icon: 0.92 };
/** Mola curta e firme: reage rápido ao tocar e volta com um leve quique ao soltar. */
const SPRING = { damping: 14, stiffness: 320, mass: 0.6 } as const;

/**
 * Animação de toque compartilhada: o elemento muda de tamanho enquanto está pressionado e volta
 * ao soltar. Aceita uma intensidade nomeada ou a escala exata (os botões flutuantes crescem).
 * Com "reduzir movimento" ligado no aparelho, não anima — fica só o feedback de cor de cada peça.
 */
export function usePressScale(strength: PressScale | number) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const target = typeof strength === 'number' ? strength : SCALES[strength];

  const animateTo = (value: number) => {
    // `.set()` em vez de `.value =`: é a forma compatível com o React Compiler.
    if (!reduceMotion) scale.set(withSpring(value, SPRING));
  };

  return { animatedStyle, onPressIn: () => animateTo(target), onPressOut: () => animateTo(1) };
}
