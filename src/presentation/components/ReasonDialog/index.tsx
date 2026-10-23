import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { ReasonDialogProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { styles } from './styles';

/** Diálogo multiplataforma com campo de texto (o Alert.prompt só existe no iOS). */
export function ReasonDialog({ visible, title, message, placeholder, confirmLabel, onConfirm, onCancel }: ReasonDialogProps) {
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
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.fieldBorder, backgroundColor: colors.surfaceMuted }]}
          />
          <View style={styles.actions}>
            <Button title={t('common.cancel')} variant="ghost" onPress={() => close(false)} style={styles.action} />
            <Button title={confirmLabel} onPress={() => close(true)} style={styles.action} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
