import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  header: { flexDirection: 'row', gap: 12 },
  headerBody: { flex: 1, gap: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  items: { gap: 0, paddingVertical: 4 },
  empty: { paddingVertical: 12 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  reportTitle: { flex: 1 },
});
