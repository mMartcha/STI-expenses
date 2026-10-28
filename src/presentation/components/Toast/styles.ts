import { StyleSheet } from 'react-native';

import { radius, shadows } from '../../theme/theme';

export const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    zIndex: 1000,
    ...shadows.lg,
  },
  message: { flex: 1, lineHeight: 20 },
  close: { padding: 4 },
});
