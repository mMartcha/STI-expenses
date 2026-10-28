import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../theme/theme';
import type { DropdownMenuProps } from '../../types/component.types';
import { AppText } from '../AppText';
import { Icon } from '../Icon';
import { styles } from './styles';

const GAP = 8;

/**
 * Menu que cai logo abaixo do gatilho (ex.: avatar da Início): `children` é o desenho do gatilho
 * e o próprio menu é o botão. A ação escolhida roda depois que o menu fecha (navegar com o
 * `Modal` ainda fechando falha no iOS, como no `BottomSheet`).
 */
export function DropdownMenu({ items, accessibilityLabel, children }: DropdownMenuProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const window = useWindowDimensions();
  const anchor = useRef<View>(null);
  const pending = useRef<(() => void) | null>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const visible = position !== null;
  const wasVisible = useRef(visible);

  const open = () =>
    anchor.current?.measureInWindow((x, y, width, height) => setPosition({ top: y + height + GAP, right: window.width - (x + width) }));
  const close = () => setPosition(null);

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  // Android não tem `onDismiss` no Modal: roda a ação quando o menu passa de aberto para fechado.
  useEffect(() => {
    if (Platform.OS !== 'ios' && wasVisible.current && !visible) runPending();
    wasVisible.current = visible;
  }, [visible]);

  return (
    <>
      <Pressable
        ref={anchor}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: visible }}
        onPress={open}
        hitSlop={6}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {children}
      </Pressable>
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={close} onDismiss={Platform.OS === 'ios' ? runPending : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={t('common.close')} />
        {position ? (
          <View
            accessibilityRole="menu"
            style={[styles.menu, { top: position.top, right: position.right, backgroundColor: colors.surfaceRaised, borderColor: colors.border, shadowColor: colors.shadow }]}>
            {items.map((item) => {
              const tint = item.destructive ? colors.error : colors.textPrimary;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    pending.current = item.onPress;
                    close();
                  }}
                  style={({ pressed }) => [styles.item, { backgroundColor: pressed ? colors.surfaceMuted : 'transparent' }]}>
                  <Icon name={item.icon} size={20} color={item.destructive ? colors.error : colors.textSecondary} />
                  <AppText color={tint}>{item.label}</AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Modal>
    </>
  );
}
