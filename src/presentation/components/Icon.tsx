import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SymbolName = Extract<ComponentProps<typeof SymbolView>['name'], { ios?: unknown }>;

/** Mapa único de ícones: SF Symbols no iOS e Material Symbols no Android. */
const ICONS = {
  receipt: { ios: 'doc.text', android: 'receipt_long' },
  camera: { ios: 'camera.fill', android: 'photo_camera' },
  gallery: { ios: 'photo.on.rectangle', android: 'photo_library' },
  add: { ios: 'plus', android: 'add' },
  delete: { ios: 'trash', android: 'delete' },
  history: { ios: 'clock.arrow.circlepath', android: 'history' },
  edit: { ios: 'pencil', android: 'edit' },
  manual: { ios: 'square.and.pencil', android: 'edit_note' },
  undo: { ios: 'arrow.uturn.backward', android: 'undo' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  offline: { ios: 'icloud.slash', android: 'cloud_off' },
  sync: { ios: 'arrow.triangle.2.circlepath', android: 'sync' },
  report: { ios: 'folder', android: 'description' },
  person: { ios: 'person.crop.circle', android: 'person' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  image: { ios: 'photo', android: 'image' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  lock: { ios: 'lock.fill', android: 'lock' },
  calendar: { ios: 'calendar', android: 'calendar_month' },
  scan: { ios: 'viewfinder', android: 'document_scanner' },
  folder: { ios: 'folder', android: 'folder' },
  paste: { ios: 'doc.on.clipboard', android: 'content_paste' },
  bell: { ios: 'bell', android: 'notifications' },
  pdf: { ios: 'doc.richtext', android: 'picture_as_pdf' },
  close: { ios: 'xmark', android: 'close' },
  openExternal: { ios: 'arrow.up.right.square', android: 'open_in_new' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: string }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
