import { Platform, StyleSheet } from 'react-native';

import { shadows, sizes } from '../../theme/theme';

/** Altura aproximada da barra de abas nativa acima da área segura (iOS sobrepõe o conteúdo). */
export const TAB_BAR_OVERLAY = Platform.select({ ios: 49, default: 0 });

export const styles = StyleSheet.create({
  stack: { position: 'absolute', right: 20, gap: 12, alignItems: 'center' },
  fab: { width: sizes.fab, height: sizes.fab, borderRadius: sizes.fab / 2, ...shadows.md },
  /** Ocupa o círculo inteiro: área de toque = botão, e o ícone fica no centro exato. */
  hitArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: sizes.fab / 2, alignItems: 'center', justifyContent: 'center' },
});
