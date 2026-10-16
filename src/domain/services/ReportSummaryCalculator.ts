import type { Expense } from '../entities/Expense';
import type { ExpenseCategory } from '../entities/ExpenseCategory';
import type { ExpenseReport } from '../entities/ExpenseReport';
import { toDateKey } from '../shared/dates';
import { Money } from '../shared/Money';

export interface ReportDay {
  date: string;
  total: Money;
  expenses: Expense[];
}

export interface ReportSummary {
  total: Money;
  /** Valor removido pelo colaborador em relação às notas originais. */
  excluded: Money;
  expenseCount: number;
  days: ReportDay[];
  byCategory: { category: ExpenseCategory; total: Money }[];
  /**
   * Adiantamento − total. Positivo: colaborador devolve; negativo: empresa reembolsa.
   * `null` quando não houve adiantamento.
   */
  advanceBalance: Money | null;
  /** Despesas fora do período do relatório (alerta, não bloqueia). */
  outOfPeriodIds: string[];
  /** Despesas cuja leitura do OCR ainda não terminou. */
  pendingOcrIds: string[];
}

/** Serviço de domínio puro: consolida as despesas de um relatório (ex.: viagem de 4 dias). */
export class ReportSummaryCalculator {
  calculate(report: ExpenseReport, expenses: readonly Expense[]): ReportSummary {
    const currency = report.currency;
    const sorted = [...expenses].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

    const days = new Map<string, ReportDay>();
    const categories = new Map<ExpenseCategory, Money>();

    for (const expense of sorted) {
      const key = toDateKey(expense.occurredAt);
      const day = days.get(key) ?? { date: key, total: Money.zero(currency), expenses: [] };
      day.total = day.total.add(expense.total);
      day.expenses.push(expense);
      days.set(key, day);

      categories.set(expense.category, (categories.get(expense.category) ?? Money.zero(currency)).add(expense.total));
    }

    const total = Money.sum(sorted.map((expense) => expense.total), currency);

    return {
      total,
      excluded: Money.sum(sorted.map((expense) => expense.excludedAmount), currency),
      expenseCount: sorted.length,
      days: [...days.values()],
      byCategory: [...categories.entries()]
        .map(([category, value]) => ({ category, total: value }))
        .sort((a, b) => b.total.amount - a.total.amount),
      advanceBalance: report.advance ? report.advance.subtract(total) : null,
      outOfPeriodIds: sorted.filter((e) => !report.coversDate(toDateKey(e.occurredAt))).map((e) => e.id),
      pendingOcrIds: sorted.filter((e) => e.ocrStatus === 'PENDING').map((e) => e.id),
    };
  }
}
