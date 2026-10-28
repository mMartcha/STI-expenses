import { StyleSheet } from 'react-native';

import { radius, shadows, sizes } from '../../theme/theme';

export const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    minWidth: 200,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.lg,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: sizes.iconButton, paddingHorizontal: 16 },
});
