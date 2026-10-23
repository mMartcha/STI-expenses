import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FormScreenProps } from '../../types/component.types';
import { styles } from './styles';

/**
 * Esqueleto de toda tela de formulário: sobe com o teclado, rola, não fecha o teclado ao tocar
 * num campo e respeita a área segura. `footer` = CTA fixo fora da rolagem.
 */
export function FormScreen({ children, footer, contentStyle }: FormScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: footer ? 24 : insets.bottom + 48 }, contentStyle]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}
