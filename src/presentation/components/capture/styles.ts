import { StyleSheet } from 'react-native';

import { radius, sizes, type ThemeColors } from '../../theme/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    viewfinder: { flex: 1, marginHorizontal: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.mediaBackground },
    flash: { position: 'absolute', top: 16, right: 16 },
    permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
    permissionIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8, backgroundColor: colors.secondary },
    centered: { textAlign: 'center' },
    permissionButton: { marginTop: 8 },
    strip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 12, paddingRight: 20, paddingTop: 12 },
    stripContent: { gap: 8, paddingVertical: 4, minHeight: 80, flexGrow: 1 },
    stripHint: { alignSelf: 'center' },
    thumb: { position: 'relative' },
    thumbRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.textPrimary },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      backgroundColor: colors.textPrimary,
    },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 16 },
    shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, alignItems: 'center', justifyContent: 'center', borderColor: colors.borderStrong },
    shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.primary },
    tipArt: { height: 168, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.secondary },
    tipReceipt: { width: 64, height: 88, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', opacity: 0.85, backgroundColor: colors.secondarySurface },
    tipReceiptCenter: { width: 84, height: 116, opacity: 1 },
    tipBody: { gap: 8, paddingHorizontal: 8, paddingTop: 20 },
    tipButton: { marginTop: 12 },
    preview: { flex: 1, marginHorizontal: 12, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.mediaBackground },
    pdf: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
    ocrPromise: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 16 },
    ocrText: { flex: 1 },
    reviewActions: { gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  });

/** Botões secundários da câmera (anexar, modo lote): mesmo tamanho do controle padrão. */
export const CONTROL_SIZE = sizes.control;
