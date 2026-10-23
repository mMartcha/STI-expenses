import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingTop: 12, paddingHorizontal: 20, gap: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  topActions: { flexDirection: 'row', gap: 10 },
  greetingCard: { gap: 6, paddingVertical: 24 },
  capitalize: { textTransform: 'capitalize' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  list: { gap: 8 },
  pending: { gap: 4 },
});
