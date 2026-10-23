import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useStyles, useTheme } from '../../theme/theme';
import type { CameraPermissionPromptProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { createStyles } from './styles';

/** Pré-permissão: explica o motivo antes do diálogo do sistema (ou leva às configurações). */
export function CameraPermissionPrompt({ canAskAgain, onContinue }: CameraPermissionPromptProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View style={styles.permission}>
      <View style={styles.permissionIcon}>
        <Icon name="camera" size={36} color={colors.onSecondary} />
      </View>
      <AppText variant="title" color={colors.onMedia} style={styles.centered}>
        {t('capture.takePhotoTitle')}
      </AppText>
      <AppText color={colors.onMediaSecondary} style={styles.centered}>
        {canAskAgain ? t('capture.cameraPermissionHint') : t('capture.cameraDenied')}
      </AppText>
      <Button title={canAskAgain ? t('capture.continue') : t('capture.openSettings')} onPress={onContinue} style={styles.permissionButton} />
    </View>
  );
}
