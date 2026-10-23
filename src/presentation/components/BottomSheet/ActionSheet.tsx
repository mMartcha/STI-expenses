import { useRef } from 'react';

import type { ActionSheetProps } from '../../types/component.types';
import { ListItem } from '../ListItem';
import { BottomSheet } from './BottomSheet';

/** Lista de ações num `BottomSheet`. A ação escolhida roda depois que o painel fecha. */
export function ActionSheet({ visible, onClose, items }: ActionSheetProps) {
  const pending = useRef<(() => void) | null>(null);

  const runPending = () => {
    const action = pending.current;
    pending.current = null;
    action?.();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} onDismissed={runPending}>
      {items.map((item) => (
        <ListItem
          key={item.key}
          icon={item.icon}
          title={item.label}
          subtitle={item.description}
          showChevron={false}
          onPress={() => {
            pending.current = item.onPress;
            onClose();
          }}
        />
      ))}
    </BottomSheet>
  );
}
