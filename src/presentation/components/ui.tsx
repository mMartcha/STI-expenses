import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';

import { font, useTheme, type FontWeight, type ThemeColors } from '../theme/theme';
import { Icon, type IconName } from './Icon';

// ---------- Texto ----------

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const variantStyles: Record<TextVariant, { fontSize: number; weight: FontWeight }> = {
  display: { fontSize: 32, weight: '700' },
  title: { fontSize: 22, weight: '700' },
  heading: { fontSize: 16, weight: '600' },
  body: { fontSize: 15, weight: '400' },
  label: { fontSize: 13, weight: '600' },
  caption: { fontSize: 12, weight: '500' },
};

export function AppText({
  variant = 'body',
  color,
  tone = 'primary',
  style,
  ...props
}: TextProps & { variant?: TextVariant; color?: string; tone?: 'primary' | 'secondary' | 'tertiary' }) {
  const { colors } = useTheme();
  const toneColor = { primary: colors.textPrimary, secondary: colors.textSecondary, tertiary: colors.textTertiary }[tone];
  const { fontSize, weight } = variantStyles[variant];
  return <Text {...props} style={[{ fontSize, ...font(weight), color: color ?? toneColor }, style]} />;
}

// ---------- Botão ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  icon,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: Omit<PressableProps, 'style'> & {
  title: string;
  icon?: IconName;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const palette = buttonPalette(colors)[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.border, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? <Icon name={icon} color={palette.text} size={18} /> : null}
          <Text style={[styles.buttonText, { color: palette.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

function buttonPalette(colors: ThemeColors) {
  return {
    primary: { background: colors.primary, border: colors.primary, text: colors.onPrimary },
    secondary: { background: colors.primarySurface, border: colors.primaryBorder, text: colors.primary },
    ghost: { background: 'transparent', border: 'transparent', text: colors.primary },
    danger: { background: 'transparent', border: colors.error, text: colors.error },
  } satisfies Record<ButtonVariant, { background: string; border: string; text: string }>;
}

// ---------- Card ----------

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>{children}</View>
  );
}

// ---------- Campo de texto ----------

export function TextField({
  label,
  error,
  hint,
  style,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.textDisabled}
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surfaceMuted,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="caption" color={colors.error}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="tertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------- Chips de seleção ----------

export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}>
              <Text style={{ color: selected ? colors.onPrimary : colors.textPrimary, fontSize: 13, ...font('500') }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------- Selo de status ----------

export type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: PillTone; icon?: IconName }) {
  const { colors } = useTheme();
  const palette: Record<PillTone, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceMuted, fg: colors.textSecondary },
    primary: { bg: colors.primarySurface, fg: colors.primary },
    success: { bg: colors.successSurface, fg: colors.success },
    warning: { bg: colors.warningSurface, fg: colors.warning },
    error: { bg: colors.errorSurface, fg: colors.error },
    info: { bg: colors.infoSurface, fg: colors.info },
  };
  const { bg, fg } = palette[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 12, ...font('600') }}>{label}</Text>
    </View>
  );
}

// ---------- Estado vazio / aviso ----------

export function EmptyState({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={40} color={colors.primaryBorder} />
      <AppText variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {hint ? (
        <AppText tone="secondary" style={{ textAlign: 'center' }}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function Notice({ tone, icon, text, action }: { tone: 'warning' | 'error' | 'info' | 'success'; icon: IconName; text: string; action?: ReactNode }) {
  const { colors } = useTheme();
  const fg = { warning: colors.warning, error: colors.error, info: colors.info, success: colors.success }[tone];
  const bg = { warning: colors.warningSurface, error: colors.errorSurface, info: colors.infoSurface, success: colors.successSurface }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg }]} accessibilityRole="alert">
      <Icon name={icon} size={18} color={fg} />
      <AppText variant="caption" style={{ flex: 1 }} color={colors.textPrimary}>
        {text}
      </AppText>
      {action}
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <AppText variant="label" tone="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </AppText>
      {right}
    </View>
  );
}

export function Row({ label, value, strong, valueColor }: { label: string; value: string; strong?: boolean; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <AppText tone={strong ? 'primary' : 'secondary'} variant={strong ? 'heading' : 'body'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'body'} color={valueColor} style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </AppText>
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 8 }} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 15, ...font('600') },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 8 },
  field: { gap: 6 },
  input: { minHeight: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 16, ...font('400') },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
});
