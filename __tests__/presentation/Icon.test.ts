import { ICON_SVGS } from '@/presentation/components/Icon/iconConfig';

/** Todo ícone precisa herdar a cor do tema e ter o desenho base de 24 px. */
describe('ICON_SVGS (Stara UI Kit)', () => {
  it.each(Object.entries(ICON_SVGS))('%s usa currentColor e não tem cor fixa', (_name, variants) => {
    const all = Object.entries(variants as Record<string, string>);
    expect(all.some(([size]) => size === '24')).toBe(true);
    for (const [size, xml] of all) {
      expect(xml).toContain(`viewBox="0 0 ${size} ${size}"`);
      expect(xml).toContain('currentColor');
      expect(xml).not.toMatch(/(?:fill|stroke)="#/);
    }
  });
});
