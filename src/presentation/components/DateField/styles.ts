import { StyleSheet } from 'react-native';

import { radius, sizes } from '../../theme/theme';

export const styles = StyleSheet.create({
  iosRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  field: { gap: 6 },
  androidField: {
    minHeight: sizes.control,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
