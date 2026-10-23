import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', gap: 6 },
  total: { fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  day: { gap: 8 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  capitalize: { textTransform: 'capitalize' },
  submit: { marginTop: 12 },
});
