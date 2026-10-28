import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { ReasonDialogProps } from '../../types/component.types';
import { Dialog, DialogActions } from '../Dialog';
import { styles } from './styles';

/** Diálogo com campo de texto (o Alert.prompt só existe no iOS), sobre a base `Dialog`. */
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
    <Dialog visible={visible} title={title} message={message} onClose={() => close(false)}>
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
      <DialogActions
        confirmLabel={confirmLabel}
        cancelLabel={t('common.cancel')}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </Dialog>
  );
}
