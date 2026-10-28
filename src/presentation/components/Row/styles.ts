import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  value: { fontVariant: ['tabular-nums'] },
});
