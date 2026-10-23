import { ICON_SVGS } from './icons.generated';

/**
 * Ícones do app: SVGs do Stara UI Kit (contorno 1,5 px), os mesmos no iOS e no Android.
 * O mapa "nome no app → arquivo do kit" fica em `scripts/generate-icons.js`; rode `npm run icons`
 * depois de mudar. Cada ícone tem a versão de 24 px e, quando o kit tem, a de 16 px.
 */
export { ICON_SVGS };

export type IconName = keyof typeof ICON_SVGS;

/** Abaixo disso usamos o desenho de 16 px do kit (traço proporcionalmente mais firme). */
export const SMALL_ICON_MAX = 18;
