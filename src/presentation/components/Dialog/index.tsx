import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { DialogActionsProps, DialogProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { styles } from './styles';

/**
 * Base dos diálogos do app (substitui o `Alert` nativo): cartão centralizado sobre o fundo
 * escurecido. Tocar fora ou no "voltar" do Android chama `onClose`, salvo com `dismissable={false}`.
 */
export function Dialog({ visible, title, message, icon, destructive, onClose, dismissable = true, children }: DialogProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const requestClose = () => (dismissable ? onClose() : undefined);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={requestClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel={t('common.close')} disabled={!dismissable} />
        <View accessibilityViewIsModal accessibilityRole="alert" style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <View style={styles.titleRow}>
            {icon ? (
              <View style={[styles.icon, { backgroundColor: destructive ? colors.surfaceMuted : colors.primarySubtle }]}>
                <Icon name={icon} size={20} color={destructive ? colors.error : colors.primaryText} />
              </View>
            ) : null}
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>
              {title}
            </AppText>
          </View>
          {message ? <AppText tone="secondary">{message}</AppText> : null}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Rodapé padrão: "Cancelar" (opcional) e a ação principal, lado a lado. */
export function DialogActions({ confirmLabel, cancelLabel, destructive, loading, onConfirm, onCancel }: DialogActionsProps) {
  return (
    <View style={styles.actions}>
      {cancelLabel && onCancel ? <Button title={cancelLabel} variant="ghost" onPress={onCancel} style={styles.action} /> : null}
      <Button title={confirmLabel} variant={destructive ? 'danger' : 'primary'} loading={loading} onPress={onConfirm} style={styles.action} />
    </View>
  );
}
