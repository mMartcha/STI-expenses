import { StyleSheet } from 'react-native';

import { radius } from '../../theme/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  hero: { gap: 32, alignItems: 'center' },
  logo: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 44, height: 44 },
  titles: { gap: 4, alignItems: 'center' },
  centered: { textAlign: 'center' },
  actions: { gap: 12 },
  hint: { textAlign: 'center' },
});
