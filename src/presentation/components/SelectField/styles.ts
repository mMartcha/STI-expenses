import { StyleSheet } from 'react-native';

import { radius, sizes } from '../../theme/theme';

export const styles = StyleSheet.create({
  field: { gap: 6 },
  control: {
    minHeight: sizes.control,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: { flex: 1 },
  title: { paddingHorizontal: 8, paddingBottom: 8 },
  list: { maxHeight: 420 },
  option: {
    minHeight: sizes.row,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
