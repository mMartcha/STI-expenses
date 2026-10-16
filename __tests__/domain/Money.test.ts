import { ValidationError } from '@/core/errors';
import { Money } from '@/domain/shared/Money';

describe('Money', () => {
  it('guarda valores em centavos e evita erro de ponto flutuante', () => {
    const total = Money.fromDecimal(0.1).add(Money.fromDecimal(0.2));
    expect(total.amount).toBe(30);
    expect(total.toDecimal()).toBe(0.3);
  });

  it('arredonda multiplicação por quantidade fracionada (ex.: litros de combustível)', () => {
    expect(Money.of(609).multiply(62.35).amount).toBe(37971);
  });

  it('rejeita valores que não são inteiros', () => {
    expect(() => Money.of(10.5)).toThrow(ValidationError);
  });

  it('soma listas e compara valores', () => {
    const sum = Money.sum([Money.of(100), Money.of(250)]);
    expect(sum.equals(Money.of(350))).toBe(true);
    expect(sum.greaterThan(Money.of(349))).toBe(true);
  });
});
