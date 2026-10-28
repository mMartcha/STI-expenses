import { StyleSheet } from 'react-native';

import { radius } from '../../theme/theme';

export const styles = StyleSheet.create({
  form: { gap: 16 },
  days: { gap: 8 },
  summary: { textAlign: 'center' },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 16,
    paddingRight: 4,
  },
  dayRowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  dayRowBody: { flex: 1, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
  capitalize: { textTransform: 'capitalize' },
});
