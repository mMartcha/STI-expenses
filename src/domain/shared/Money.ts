import { ValidationError } from '@/core/errors';

/**
 * Moedas suportadas. Hoje só BRL; para adicionar uma moeda basta incluí-la aqui
 * com a quantidade de casas decimais (minor units) — o restante do domínio já é agnóstico.
 */
export const CURRENCIES = {
  BRL: { minorUnits: 2 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const DEFAULT_CURRENCY: CurrencyCode = 'BRL';

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

/** Arredondamento "half away from zero", o usual em valores monetários. */
function roundHalfAwayFromZero(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/**
 * Value object monetário. O valor é guardado em inteiros na menor unidade da moeda
 * (centavos para BRL) para evitar erros de ponto flutuante.
 */
export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: CurrencyCode,
  ) {}

  static of(amount: number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    if (!Number.isSafeInteger(amount)) {
      throw new ValidationError('amount', 'O valor monetário deve ser um inteiro em centavos');
    }
    return new Money(amount, currency);
  }

  static zero(currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    return new Money(0, currency);
  }

  /** Converte um valor decimal (ex.: 12.34) para a menor unidade da moeda. */
  static fromDecimal(value: number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    const factor = 10 ** CURRENCIES[currency].minorUnits;
    return Money.of(roundHalfAwayFromZero(Number((value * factor).toFixed(6))), currency);
  }

  static sum(values: readonly Money[], currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    return values.reduce((acc, value) => acc.add(value), Money.zero(currency));
  }

  toDecimal(): number {
    return this.amount / 10 ** CURRENCIES[this.currency].minorUnits;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(roundHalfAwayFromZero(this.amount * factor), this.currency);
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  greaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toJSON(): { amount: number; currency: CurrencyCode } {
    return { amount: this.amount, currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new ValidationError('currency', `Moedas diferentes: ${this.currency} e ${other.currency}`);
    }
  }
}
