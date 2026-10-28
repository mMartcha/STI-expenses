import { StyleSheet } from 'react-native';

import { radius, textStyle } from '../../theme/theme';

export const styles = StyleSheet.create({
  input: { minHeight: 72, borderWidth: 1, borderRadius: radius.sm, padding: 12, ...textStyle('body'), lineHeight: undefined, textAlignVertical: 'top' },
});
