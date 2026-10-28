import { StyleSheet } from 'react-native';

import { sizes, typography } from '../../theme/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 8 },
  header: { gap: 16, marginBottom: 8 },
  navigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayHeader: { justifyContent: 'center', minHeight: sizes.iconButton },
  capitalize: { textTransform: 'capitalize' },
  period: { gap: 8 },
  total: { fontVariant: ['tabular-nums'], textAlign: 'center' },
  centered: { textAlign: 'center' },
  // Altura de uma linha do `title`: o card não muda de tamanho entre o spinner e o valor.
  totalSlot: { minHeight: typography.title.lineHeight, alignItems: 'center', justifyContent: 'center' },
  listLoading: { paddingTop: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
});
