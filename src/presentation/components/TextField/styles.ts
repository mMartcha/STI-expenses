import { StyleSheet } from 'react-native';

import { radius, sizes, textStyle } from '../../theme/theme';

export const styles = StyleSheet.create({
  field: { gap: 6 },
  // Sem lineHeight: no iOS ele desalinha o texto digitado verticalmente.
  multiline: { minHeight: 72, paddingTop: 12, textAlignVertical: 'top' },
  input: { minHeight: sizes.control, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: 14, ...textStyle('body'), lineHeight: undefined },
});
