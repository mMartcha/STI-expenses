import { StyleSheet } from 'react-native';

import { radius } from '../../theme/theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: radius.lg, padding: 20, gap: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  action: { flex: 1 },
});
