import { parseMoneyInput, parseQuantityInput } from '@/presentation/utils/format';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'pt-BR', languageCode: 'pt' }],
}));

describe('parseMoneyInput', () => {
  it.each([
    ['12,34', 1234],
    ['12.34', 1234],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['R$ 45', 4500],
    ['0,5', 50],
    ['1.000', 100000],
  ])('"%s" → %d centavos', (input, expected) => {
    expect(parseMoneyInput(input)).toBe(expected);
  });

  it('rejeita entradas inválidas', () => {
    expect(parseMoneyInput('')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
  });
});

describe('parseQuantityInput', () => {
  it('aceita vírgula decimal e rejeita zero', () => {
    expect(parseQuantityInput('62,35')).toBe(62.35);
    expect(parseQuantityInput('0')).toBeNull();
  });
});
