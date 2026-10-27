import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 8 },
  header: { gap: 16, marginBottom: 8 },
  navigator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capitalize: { textTransform: 'capitalize' },
  total: { fontVariant: ['tabular-nums'] },
  dayTotal: { textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
});
