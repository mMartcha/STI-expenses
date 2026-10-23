import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ICON_SVGS, SMALL_ICON_MAX, type IconName } from './iconConfig';

export { ICON_SVGS, type IconName } from './iconConfig';

function xmlFor(name: IconName, size: number): string {
  const variants: { 24: string; 16?: string } = ICON_SVGS[name];
  return size <= SMALL_ICON_MAX && variants[16] ? variants[16] : variants[24];
}

/**
 * Ícone do Stara UI Kit. O SVG usa `currentColor`, então a cor vem sempre da prop `color`
 * (um papel do tema). Como o desenho tem `viewBox` próprio, fica centrado no quadrado `size`
 * nas duas plataformas, sem depender de métricas de fonte.
 */
export function Icon({
  name,
  size = 20,
  color,
  strokeWidth,
}: {
  name: IconName;
  size?: number;
  color: string;
  /** Traço no grid do desenho (o kit usa 1,5). Só para destaques, como os botões flutuantes. */
  strokeWidth?: number;
}) {
  const base = xmlFor(name, size);
  const xml = strokeWidth ? base.replace(/stroke-width="[\d.]+"/g, `stroke-width="${strokeWidth}"`) : base;
  return (
    <View style={{ width: size, height: size }} accessible={false} importantForAccessibility="no-hide-descendants">
      <SvgXml xml={xml} width={size} height={size} color={color} />
    </View>
  );
}
