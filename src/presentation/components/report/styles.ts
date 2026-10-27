import { StyleSheet } from 'react-native';

import { radius, type ThemeColors } from '../../theme/theme';

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    body: { flex: 1, gap: 4 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    trailing: { alignItems: 'flex-end', gap: 6 },
    tabular: { fontVariant: ['tabular-nums'] },
    form: { gap: 16 },
    days: { gap: 8 },
    dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    dayChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    // Seleção de despesas do período
    pickerScreen: { flex: 1 },
    pickerContent: { padding: 16 },
    pickerHeader: { gap: 4, paddingBottom: 8 },
    pickerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    pickerSection: { paddingTop: 12, paddingBottom: 6 },
    pickerGap: { height: 8 },
    pickerFooter: { padding: 16, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
    flex: { flex: 1 },
  });

const STEP = 22;

/** Andamento da aprovação (Início › Pendências). */
export const createApprovalStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: 8, paddingVertical: 8, paddingHorizontal: 4, borderRadius: radius.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    tabular: { fontVariant: ['tabular-nums'] },
    steps: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
    stepGroup: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
    step: { alignItems: 'center', gap: 6, flex: 1 },
    stepLabel: { textAlign: 'center' },
    line: { position: 'absolute', top: STEP / 2, left: '-50%', right: '50%', height: 1.5, backgroundColor: colors.borderStrong },
    lineDone: { backgroundColor: colors.textPrimary },
    circle: {
      width: STEP,
      height: STEP,
      borderRadius: STEP / 2,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    done: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
    current: { backgroundColor: colors.infoSurface, borderColor: colors.info },
    next: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
    currentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.info },
  });
