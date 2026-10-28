import { useMemo } from 'react';

import { textStyle, useTheme } from '../theme/theme';

/** Cabeçalho e fundo padrão de todo `Stack` do app (o principal e os aninhados em modais). */
export function useStackScreenOptions() {
  const { colors } = useTheme();
  return useMemo(
    () => ({
      headerTintColor: colors.primaryText,
      headerTitleStyle: { color: colors.textPrimary, fontFamily: textStyle('subtitle').fontFamily, fontSize: textStyle('subtitle').fontSize },
      headerStyle: { backgroundColor: colors.background },
      contentStyle: { backgroundColor: colors.background },
      headerBackButtonDisplayMode: 'minimal' as const,
    }),
    [colors],
  );
}
