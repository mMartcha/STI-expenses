import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/theme';
import type { BottomSheetProps } from '../../types/component.types';
import { styles } from './styles';

/**
 * Painel que sobe da base da tela, sobre um fundo escurecido. Fecha ao tocar fora ou no
 * "voltar" do Android.
 *
 * `onDismissed` roda depois que o painel saiu de vez da tela. Use-o para navegar: abrir uma
 * rota modal enquanto o `Modal` ainda está fechando falha no iOS.
 */
export function BottomSheet({ visible, onClose, onDismissed, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const wasVisible = useRef(visible);

  // Android não tem `onDismiss` no Modal: avisamos quando `visible` passa de true para false.
  useEffect(() => {
    if (Platform.OS !== 'ios' && wasVisible.current && !visible) onDismissed?.();
    wasVisible.current = visible;
  }, [visible, onDismissed]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onDismiss={Platform.OS === 'ios' ? onDismissed : undefined}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
          {children}
        </View>
      </View>
    </Modal>
  );
}
