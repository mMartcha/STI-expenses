import { StyleSheet } from 'react-native';

import { radius, type ThemeColors } from '../../theme/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 8 },
    default: { backgroundColor: colors.surface, borderColor: colors.border },
    muted: { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
    brand: { backgroundColor: colors.primarySubtle, borderColor: colors.primarySubtleBorder },
  });
