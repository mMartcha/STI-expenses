import { StyleSheet } from 'react-native';

import { radius, textStyle } from '../../theme/theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: radius.lg, padding: 20, gap: 12 },
  input: { minHeight: 72, borderWidth: 1, borderRadius: radius.sm, padding: 12, ...textStyle('body'), lineHeight: undefined, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1 },
});
