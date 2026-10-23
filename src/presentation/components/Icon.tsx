import { SymbolView } from 'expo-symbols';
import materialSymbols from 'expo-symbols/androidWeights/regular';
import type { ComponentProps } from 'react';
import { Platform, Text, View } from 'react-native';

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
  flashOn: { ios: 'bolt.fill', android: 'flash_on' },
  flashOff: { ios: 'bolt.slash.fill', android: 'flash_off' },
  multiple: { ios: 'square.stack.3d.up', android: 'burst_mode' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward' },
  attach: { ios: 'paperclip', android: 'attach_file' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

/**
 * Pontos de código dos Material Symbols usados acima (fonte: `expo-symbols/build/android/symbols.json`;
 * o teste `Icon.test.ts` garante que batem com o pacote instalado).
 */
export const MATERIAL_CODEPOINTS: Record<(typeof ICONS)[IconName]['android'], number> = {
  receipt_long: 0xef6e,
  photo_camera: 0xe412,
  photo_library: 0xe413,
  add: 0xe145,
  delete: 0xe872,
  history: 0xe889,
  edit: 0xe3c9,
  edit_note: 0xe745,
  undo: 0xe166,
  check_circle: 0xe86c,
  cloud_off: 0xe2c1,
  sync: 0xe627,
  description: 0xe873,
  person: 0xe7fd,
  logout: 0xe9ba,
  chevron_right: 0xe5cc,
  chevron_left: 0xe5cb,
  image: 0xe3f4,
  warning: 0xe002,
  lock: 0xe897,
  calendar_month: 0xebcc,
  document_scanner: 0xe5fa,
  folder: 0xe2c7,
  content_paste: 0xe14f,
  notifications: 0xe7f4,
  picture_as_pdf: 0xe415,
  close: 0xe5cd,
  open_in_new: 0xe89e,
  flash_on: 0xe3e7,
  flash_off: 0xe3e6,
  burst_mode: 0xe43c,
  auto_awesome: 0xe65f,
  expand_more: 0xe5cf,
  arrow_forward: 0xe5c8,
  attach_file: 0xe226,
};

/** Fonte dos Material Symbols, carregada no layout raiz junto com a Montserrat. */
export const ICON_FONT = { [materialSymbols.name]: materialSymbols.font };

/**
 * iOS: SF Symbol nativo (já vem centralizado).
 *
 * Android: desenhamos o glifo nós mesmos. O `SymbolView` do pacote ancora o texto no canto
 * superior esquerdo e deixa a fonte escalar com a acessibilidade do sistema, o que desloca o
 * ícone para baixo/direita (bem visível nos botões redondos). Na fonte, cada glifo fica centrado
 * a 0,5 em da linha de base e a caixa de linha (ascent 1,1 em + descent 0,1 em) também tem o
 * centro a 0,6 em do topo; então, sem `includeFontPadding` e centralizando a caixa no quadrado
 * do ícone, o desenho fica exatamente no centro. O tamanho do ícone não acompanha a escala de
 * fonte do sistema: ele já é dimensionado pelo layout.
 */
export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color: string }) {
  if (Platform.OS === 'android') {
    return (
      <View
        style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
        accessible={false}
        importantForAccessibility="no-hide-descendants">
        <Text
          allowFontScaling={false}
          style={{ fontFamily: materialSymbols.name, fontSize: size, color, includeFontPadding: false, textAlign: 'center' }}>
          {String.fromCharCode(MATERIAL_CODEPOINTS[ICONS[name].android])}
        </Text>
      </View>
    );
  }
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
