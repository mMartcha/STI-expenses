import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const android = Platform.OS === 'android';

/** A vibração é um extra: aparelho sem motor ou recurso desligado não pode quebrar a ação. */
function run(feedback: () => Promise<void>) {
  feedback().catch(() => undefined);
}

/**
 * Respostas táteis do app, num lugar só. No Android usa os efeitos do sistema
 * (`performAndroidHapticsAsync`, recomendado pela doc e sem permissão de vibração); no iOS, o
 * Taptic Engine — que não vibra com a câmera aberta, em modo pouca energia ou se o usuário desligou.
 */
export const haptics = {
  /** Toque em ação principal (botões flutuantes). */
  tap: () => run(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Virtual_Key) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))),
  /** Toque mais firme (disparador da câmera). */
  press: () =>
    run(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Context_Click) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))),
  /** Mudança de escolha: aba, opção, despesa marcada, semana anterior/seguinte. */
  selection: () => run(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick) : Haptics.selectionAsync())),
  success: () =>
    run(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))),
  /** Antes de uma ação destrutiva (diálogo de exclusão). */
  warning: () =>
    run(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))),
  error: () =>
    run(() => (android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error))),
};
