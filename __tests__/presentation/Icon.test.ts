// Caminho relativo de propósito: o `exports` do pacote não expõe este arquivo.
import symbols from '../../node_modules/expo-symbols/build/android/symbols.json';

import { MATERIAL_CODEPOINTS } from '@/presentation/components/Icon';

jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
jest.mock('expo-symbols/androidWeights/regular', () => ({
  __esModule: true,
  default: { name: 'MaterialSymbols_400Regular', font: 1 },
}));

/** Se o pacote de ícones mudar algum código, o Android passaria a desenhar o símbolo errado. */
describe('MATERIAL_CODEPOINTS', () => {
  it.each(Object.entries(MATERIAL_CODEPOINTS))('%s bate com o expo-symbols instalado', (name, codepoint) => {
    expect((symbols as Record<string, number>)[name]).toBe(codepoint);
  });
});
