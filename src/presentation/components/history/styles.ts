import { StyleSheet } from 'react-native';

import type { ThemeColors } from '../../theme/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: { gap: 0 },
    entry: { flexDirection: 'row' },
    dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, marginRight: -5, zIndex: 1, backgroundColor: colors.primary },
    content: { flex: 1, gap: 4, paddingLeft: 16, paddingBottom: 20, borderLeftWidth: 1, borderLeftColor: colors.border },
    struck: { textDecorationLine: 'line-through' },
  });
