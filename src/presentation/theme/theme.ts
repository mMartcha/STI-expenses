import { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { palette } from './palette';

/**
 * Papéis de cor do app, montados sobre os tokens oficiais (`palette.ts`).
 *
 * Regras de contraste (WCAG AA) que guiam a escolha dos tons:
 * - texto sobre o laranja usa `onPrimary` (neutral.900, ~4,6:1); branco sobre primary.500 só passa em texto grande;
 * - texto na cor da marca usa `primaryText` (primary.700 no claro, primary.400 no escuro), nunca `primary`;
 * - `success`/`error`/`warning`/`info` já são os tons legíveis como texto sobre o fundo e sobre a `*Surface`.
 */
const lightRoles = {
  primary: palette.primary[500],
  primaryDark: palette.primary[700],
  primaryText: palette.primary[700],
  primaryLight: 'rgba(229, 100, 37, 0.15)',
  /** Destaque suave de marca (cards de resumo): laranja a 6%, o texto continua neutro. */
  primarySubtle: 'rgba(229, 100, 37, 0.06)',
  primarySubtleBorder: 'rgba(229, 100, 37, 0.18)',
  primarySurface: palette.primary[50],
  primaryBorder: palette.primary[100],
  onPrimary: palette.neutral[900],

  /** Verde da marca: destaques (dicas, onboarding), nunca para ação. */
  secondary: palette.secondary[500],
  secondarySurface: palette.secondary[50],
  onSecondary: palette.white.default,

  background: palette.white.default,
  surface: palette.white.default,
  surfaceMuted: palette.neutral[50],
  surfaceRaised: palette.white.default,
  /** Botão secundário, aba ativa, chips, FAB secundário. */
  surfaceElevated: palette.neutral[50],
  /** Trilho das abas (Dia | Semana): meio-termo entre `background` (#FFF) e a aba ativa (`surfaceElevated`). */
  segmentedTrack: '#FAFAFA',
  overlay: palette.black.subtlest,
  /** Fundo da câmera e do visualizador de comprovante (sempre escuro, nos dois temas). */
  mediaBackground: palette.neutral[900],
  /** Texto e ícones sobre foto/câmera. */
  onMedia: palette.white.default,
  onMediaSecondary: palette.neutral[100],
  /** Fundo de botões sobre a foto (ex.: flash). */
  mediaScrim: 'rgba(22, 22, 23, 0.6)',
  shadow: palette.black.default,
  border: palette.neutral[100],
  borderStrong: palette.neutral[200],
  fieldBorder: palette.neutral[500],

  textPrimary: palette.neutral[800],
  textSecondary: palette.neutral[600],
  textTertiary: palette.neutral[600],
  textDisabled: palette.neutral[300],

  success: palette.success[700],
  successSurface: palette.success[50],
  error: palette.error[700],
  errorSurface: palette.error[50],
  warning: palette.warning[800],
  warningSurface: palette.warning[50],
  info: palette.info[700],
  infoSurface: palette.info[50],
  /** Ponto de "não lido"/pendência. */
  attention: palette.error[500],
  /** Toasts: fundo sólido e texto branco, iguais nos dois temas (como no app-stara-ai). */
  toastSuccess: palette.success[700],
  toastError: palette.error[700],
  toastInfo: palette.info[700],
  onToast: palette.white.default,
};

export type ThemeColors = Record<keyof typeof lightRoles, string>;

export const lightColors: ThemeColors = lightRoles;

export const darkColors: ThemeColors = {
  primary: palette.primary[500],
  primaryDark: palette.primary[700],
  primaryText: palette.primary[400],
  primaryLight: 'rgba(229, 100, 37, 0.22)',
  primarySubtle: 'rgba(229, 100, 37, 0.08)',
  primarySubtleBorder: 'rgba(229, 100, 37, 0.2)',
  primarySurface: palette.primary[900],
  primaryBorder: palette.primary[800],
  onPrimary: palette.neutral[900],

  secondary: palette.secondary[500],
  secondarySurface: palette.secondary[900],
  onSecondary: palette.white.default,

  background: palette.neutral[900],
  surface: palette.neutral[800],
  surfaceMuted: palette.neutral[800],
  surfaceRaised: palette.neutral[800],
  surfaceElevated: palette.neutral[700],
  /** Meio-termo entre `background` (neutral.900) e a aba ativa (neutral.700). */
  segmentedTrack: '#212122',
  overlay: palette.black.subtle,
  mediaBackground: palette.neutral[900],
  onMedia: palette.white.default,
  onMediaSecondary: palette.neutral[100],
  mediaScrim: 'rgba(22, 22, 23, 0.6)',
  shadow: palette.black.default,
  border: palette.neutral[700],
  borderStrong: palette.neutral[600],
  fieldBorder: palette.neutral[500],

  textPrimary: palette.neutral[50],
  textSecondary: palette.neutral[300],
  textTertiary: palette.neutral[400],
  textDisabled: palette.neutral[600],

  success: palette.success[300],
  successSurface: palette.success[900],
  error: palette.error[300],
  errorSurface: palette.error[900],
  warning: palette.warning[500],
  warningSurface: palette.warning[900],
  info: palette.info[300],
  infoSurface: palette.info[900],
  attention: palette.error[500],
  /** Toasts: fundo sólido e texto branco, iguais nos dois temas (como no app-stara-ai). */
  toastSuccess: palette.success[700],
  toastError: palette.error[700],
  toastInfo: palette.info[700],
  onToast: palette.white.default,
};

/**
 * Montserrat (identidade STARA). Com fontes carregadas por arquivo, o Android não sintetiza
 * pesos: cada peso é uma família própria, então usamos `font('600')` em vez de `fontWeight`.
 */
export const fontFamilies = {
  '400': 'Montserrat_400Regular',
  '500': 'Montserrat_500Medium',
  '600': 'Montserrat_600SemiBold',
  '700': 'Montserrat_700Bold',
} as const;

export type FontWeight = keyof typeof fontFamilies;

export function font(weight: FontWeight = '400') {
  return { fontFamily: fontFamilies[weight] };
}

/**
 * Escala tipográfica única (design system STARA, Montserrat). Toda fonte do app sai daqui:
 * use `<AppText variant>` ou `textStyle('variant')`; nunca `fontSize`/`fontWeight` soltos.
 */
export const typography = {
  /** Saudação e totais em destaque. */
  display: { fontSize: 32, lineHeight: 40, weight: '700' },
  /** Título de tela/aba, estado vazio, título de painel. */
  title: { fontSize: 24, lineHeight: 32, weight: '700' },
  /** Título de navegação e de seção. */
  subtitle: { fontSize: 18, lineHeight: 24, weight: '600' },
  /** Título de linha de lista, valores em destaque. */
  heading: { fontSize: 16, lineHeight: 22, weight: '600' },
  /** Texto corrido e campos. */
  body: { fontSize: 16, lineHeight: 24, weight: '400' },
  /** Botões e abas. */
  button: { fontSize: 16, lineHeight: 20, weight: '600' },
  /** Rótulos de seção, links curtos, chips. */
  label: { fontSize: 13, lineHeight: 18, weight: '600' },
  /** Legendas, selos, metadados. */
  caption: { fontSize: 12, lineHeight: 16, weight: '500' },
} as const satisfies Record<string, { fontSize: number; lineHeight: number; weight: FontWeight }>;

export type TypographyVariant = keyof typeof typography;

/** Estilo de texto pronto de um nível da escala (para `TextInput`, cabeçalhos nativos etc.). */
export function textStyle(variant: TypographyVariant) {
  const { fontSize, lineHeight, weight } = typography[variant];
  return { fontSize, lineHeight, ...font(weight) };
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
/** Campo 8 · item de lista 12 · card 20 · bottom sheet 24 · botões em pílula. */
export const radius = { sm: 8, md: 12, lg: 20, xl: 24, pill: 999 } as const;
/** Alturas mínimas de toque e tamanhos de controles. */
export const sizes = { control: 52, fab: 56, row: 56, iconButton: 44, avatar: 44 } as const;

const isIOS = Platform.OS === 'ios';

/** Elevação em 3 níveis (mesma ideia do app-stara-ai); a cor vem de `colors.shadow`. */
export const shadows = {
  sm: { shadowOffset: { width: 0, height: isIOS ? 1 : 2 }, shadowOpacity: isIOS ? 0.06 : 0.12, shadowRadius: isIOS ? 4 : 6, elevation: 2 },
  md: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  lg: { shadowOffset: { width: 0, height: isIOS ? 4 : 8 }, shadowOpacity: isIOS ? 0.12 : 0.2, shadowRadius: isIOS ? 16 : 20, elevation: 8 },
} as const;

/**
 * Tema do app. O padrão é o escuro; `'system'` voltaria a seguir a configuração do aparelho.
 * O `userInterfaceStyle` do `app.config.ts` deve acompanhar (vale para componentes nativos:
 * alertas, seletor de data, teclado).
 */
export type ColorSchemePreference = 'dark' | 'light' | 'system';
export const COLOR_SCHEME: ColorSchemePreference = 'dark';

/** Esquema efetivo ('dark' | 'light'), já aplicando a preferência acima. */
export function useAppColorScheme(): 'dark' | 'light' {
  const system = useColorScheme();
  if (COLOR_SCHEME !== 'system') return COLOR_SCHEME;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useAppColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { colors, spacing, radius, typography, sizes, shadows, dark: scheme === 'dark' };
}

export type Theme = ReturnType<typeof useTheme>;

/**
 * Estilos que dependem do tema: cada componente exporta `createStyles(colors)` no seu
 * `styles.ts` e chama `useStyles(createStyles)`. Recria só quando o tema (claro/escuro) muda.
 */
export function useStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
