import { Platform, StyleSheet } from 'react-native';

import { shadows, sizes } from '../../theme/theme';

/**
 * Quanto do fim da tela de aba fica coberto pela barra de abas nativa. No iOS a barra
 * (49) sobrepõe o conteúdo junto com a área segura; no Android o conteúdo já termina
 * acima da barra, que por sua vez já fica acima da barra de gestos.
 */
export function tabBarOverlay(safeAreaBottom: number) {
  return Platform.OS === 'ios' ? 49 + safeAreaBottom : 0;
}
/** Distância da pilha de botões até a barra de abas. */
export const FAB_STACK_OFFSET = 16;
const FAB_GAP = 12;

export const styles = StyleSheet.create({
  stack: { position: 'absolute', right: 20, gap: FAB_GAP, alignItems: 'center' },
  fab: { width: sizes.fab, height: sizes.fab, borderRadius: sizes.fab / 2, ...shadows.md },
  /** Ocupa o círculo inteiro: área de toque = botão, e o ícone fica no centro exato. */
  hitArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: sizes.fab / 2, alignItems: 'center', justifyContent: 'center' },
});
