import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { usePressScale } from '../../hooks/usePressScale';
import type { PressableScaleProps } from '../../types/component.types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * `Pressable` com a animação de toque do app (`usePressScale`). Base de cards, botões e botões
 * de ícone: aceita o mesmo `style` em função de `{ pressed }`, para manter o feedback de cor.
 */
export function PressableScale({ scale = 'button', style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  // O `style` em função não chega ao componente animado: o estado de toque é guardado aqui.
  const [pressed, setPressed] = useState(false);
  const press = usePressScale(scale);

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        setPressed(true);
        press.onPressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        press.onPressOut();
        onPressOut?.(event);
      }}
      style={[typeof style === 'function' ? style({ pressed }) : style, press.animatedStyle]}
    />
  );
}
