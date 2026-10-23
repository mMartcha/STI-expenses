import { StyleSheet } from 'react-native';

import { radius } from '../../theme/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 24, gap: 32 },
  logo: { width: 72, height: 72, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 44, height: 44 },
  titles: { gap: 4 },
  form: { gap: 16 },
});
