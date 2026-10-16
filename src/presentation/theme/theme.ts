import { useColorScheme } from 'react-native';

/** Paleta STARA — mesma base do app-stara-ai (laranja principal #E56425). */
export const lightColors = {
  primary: '#E56425',
  primaryDark: '#B94C16',
  primaryLight: 'rgba(229, 100, 37, 0.15)',
  primarySurface: '#FFF3EA',
  primaryBorder: '#F4C8B0',
  onPrimary: '#FFFFFF',
  accentGold: '#D7A35B',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F5F2',
  surfaceRaised: '#FFFCFA',
  overlay: 'rgba(0,0,0,0.4)',
  border: '#DCDDDF',
  borderStrong: '#E8DDD3',

  textPrimary: '#1C1C1D',
  textSecondary: '#7B7B7D',
  textTertiary: '#9B8F85',
  textDisabled: '#9CA3AF',

  success: '#0AA75B',
  successSurface: '#E6F6EE',
  error: '#EF4444',
  errorSurface: '#FDECEC',
  warning: '#F59E0B',
  warningSurface: '#FEF5E6',
  info: '#3B82F6',
  infoSurface: '#EAF2FE',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  ...lightColors,
  primaryLight: 'rgba(229, 100, 37, 0.22)',
  primarySurface: '#2A1C14',
  primaryBorder: '#5A3420',

  background: '#161617',
  surface: '#1E1F21',
  surfaceMuted: '#1E1F21',
  surfaceRaised: '#191A1C',
  overlay: 'rgba(0,0,0,0.6)',
  border: '#3B3D42',
  borderStrong: '#626263',

  textPrimary: '#F5F7FA',
  textSecondary: '#C4C8CF',
  textTertiary: '#969BA4',
  textDisabled: '#6B7280',

  successSurface: '#123224',
  errorSurface: '#3A1A1A',
  warningSurface: '#3A2C12',
  infoSurface: '#152238',
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

export const spacing ={ xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 } as const;
export const fontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, xxl: 28, display: 34 } as const;

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { colors, spacing, radius, fontSize, dark: scheme === 'dark' };
}

export type Theme = ReturnType<typeof useTheme>;
