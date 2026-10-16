import { CURRENCIES, type CurrencyCode } from '@/domain/shared/Money';

import { currentLocale } from '../i18n';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Formata um valor em centavos de acordo com a moeda e o idioma do aparelho. */
export function formatMoney(amount: number, currency: CurrencyCode = 'BRL'): string {
  const key = `${currentLocale()}|${currency}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(currentLocale(), { style: 'currency', currency });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(amount / 10 ** CURRENCIES[currency].minorUnits);
}

/** Valor em centavos → texto editável (ex.: 1234 → "12,34"). */
export function centsToInput(amount: number, currency: CurrencyCode = 'BRL'): string {
  const digits = CURRENCIES[currency].minorUnits;
  const decimalSeparator = (1.1).toLocaleString(currentLocale()).charAt(1);
  return (amount / 10 ** digits).toFixed(digits).replace('.', decimalSeparator);
}

/**
 * Texto digitado → centavos. Aceita "12,34", "12.34", "1.234,56" e "R$ 12".
 * Retorna `null` se não for um número válido.
 */
export function parseMoneyInput(text: string, currency: CurrencyCode = 'BRL'): number | null {
  const cleaned = text.replace(/[^\d.,-]/g, '');
  if (!cleaned) return null;
  const lastSeparator = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  const digits = CURRENCIES[currency].minorUnits;

  let normalized: string;
  if (lastSeparator >= 0 && cleaned.length - lastSeparator - 1 <= digits) {
    const integer = cleaned.slice(0, lastSeparator).replace(/[.,]/g, '');
    normalized = `${integer || '0'}.${cleaned.slice(lastSeparator + 1)}`;
  } else {
    normalized = cleaned.replace(/[.,]/g, '');
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 10 ** digits);
}

export function parseQuantityInput(text: string): number | null {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function formatQuantity(value: number): string {
  return value.toLocaleString(currentLocale(), { maximumFractionDigits: 3 });
}

export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = { dateStyle: 'short' }): string {
  const date = typeof value === 'string' ? parseDateValue(value) : value;
  return new Intl.DateTimeFormat(currentLocale(), options).format(date);
}

export function formatDateTime(value: string): string {
  return formatDate(value, { dateStyle: 'short', timeStyle: 'short' });
}

export function formatTime(value: string): string {
  return formatDate(value, { timeStyle: 'short' });
}

/** "YYYY-MM-DD" é interpretado como dia local (o construtor de Date usaria UTC). */
export function parseDateValue(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

export function formatDayHeader(dateKey: string): string {
  return formatDate(dateKey, { weekday: 'long', day: '2-digit', month: 'long' });
}
