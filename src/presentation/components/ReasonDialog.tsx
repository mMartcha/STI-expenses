import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../theme/theme';
import { AppText, Button } from './ui';

/** Diálogo multiplataforma com campo de texto (o Alert.prompt só existe no iOS). */
export function ReasonDialog({
  visible,
  title,
  message,
  placeholder,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  placeholder: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [reason, setReason] = useState('');

  const close = (confirmed: boolean) => {
    if (confirmed) onConfirm(reason.trim());
    else onCancel();
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => close(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} accessibilityLabel={t('common.cancel')} />
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <AppText variant="heading">{title}</AppText>
          <AppText tone="secondary">{message}</AppText>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder={placeholder}
            placeholderTextColor={colors.textDisabled}
            maxLength={300}
            multiline
            autoFocus
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
          />
          <View style={styles.actions}>
            <Button title={t('common.cancel')} variant="ghost" onPress={() => close(false)} style={{ flex: 1 }} />
            <Button title={confirmLabel} onPress={() => close(true)} style={{ flex: 1 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  dialog: { borderRadius: 16, padding: 20, gap: 12 },
  input: { minHeight: 72, borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 8 },
});
