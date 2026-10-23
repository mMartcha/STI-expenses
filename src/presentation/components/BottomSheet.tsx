import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, sizes, useTheme } from '../theme/theme';
import { Icon, type IconName } from './Icon';
import { AppText } from './ui';

/**
 * Painel que sobe da base da tela, sobre um fundo escurecido. Fecha ao tocar fora ou no
 * "voltar" do Android.
 *
 * `onDismissed` roda depois que o painel saiu de vez da tela. Use-o para navegar: abrir uma
 * rota modal enquanto o `Modal` ainda está fechando falha no iOS.
 */
export function BottomSheet({
  visible,
  onClose,
  onDismissed,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  children: ReactNode;
}) {
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

export interface ActionSheetItem {
  key: string;
  icon: IconName;
  label: string;
  description?: string;
  onPress: () => void;
}

/** Lista de ações (ícone + rótulo) num `BottomSheet`. A ação escolhida roda depois que o painel fecha. */
export function ActionSheet({
  visible,
  onClose,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  items: readonly ActionSheetItem[];
}) {
  const { colors } = useTheme();
  const pending = useRef<(() => void) | null>(null);

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} onDismissed={runPending}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityLabel={item.description ? `${item.label}. ${item.description}` : item.label}
          onPress={() => {
            pending.current = item.onPress;
            onClose();
          }}
          style={({ pressed }) => [styles.item, { backgroundColor: pressed ? colors.surfaceMuted : 'transparent' }]}>
          <View style={[styles.itemIcon, { backgroundColor: colors.surfaceElevated }]}>
            <Icon name={item.icon} size={20} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="heading">{item.label}</AppText>
            {item.description ? (
              <AppText variant="caption" tone="secondary">
                {item.description}
              </AppText>
            ) : null}
          </View>
        </Pressable>
      ))}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: sizes.row,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  itemIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
