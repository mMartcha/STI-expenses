import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Expense } from '@/domain/entities/Expense';
import { toDateKey } from '@/domain/shared/dates';

/** Despesas escolhidas num dia: id → valor (centavos), para o resumo sem consultar o banco de novo. */
export type DaySelection = ReadonlyMap<string, number>;
/** Dia (YYYY-MM-DD) → despesas escolhidas nele. */
export type DraftSelection = ReadonlyMap<string, DaySelection>;

interface ReportDraftValue {
  /** Modo "dias específicos": só entram dias com ao menos uma despesa. */
  days: DraftSelection;
  /** Modo "intervalo": despesas escolhidas, agrupadas pelo dia em que ocorreram. */
  range: DraftSelection;
  /** Salva as despesas de um dia (lista vazia remove o dia). */
  saveDay: (day: string, expenses: readonly Expense[]) => void;
  removeDay: (day: string) => void;
  /** Substitui a escolha do intervalo inteiro. */
  saveRange: (expenses: readonly Expense[]) => void;
}

const ReportDraftContext = createContext<ReportDraftValue | null>(null);

/**
 * Estado do "novo relatório" enquanto o modal está aberto: o formulário e a tela de despesas
 * (rotas irmãs em `report/new`) leem e gravam aqui. Some junto com o modal, sem limpeza manual.
 */
export function ReportDraftProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState<DraftSelection>(new Map());
  const [range, setRange] = useState<DraftSelection>(new Map());

  const saveDay = useCallback((day: string, expenses: readonly Expense[]) => {
    setDays((current) => {
      const next = new Map(current);
      if (expenses.length === 0) next.delete(day);
      else next.set(day, new Map(expenses.map((expense) => [expense.id, expense.total.amount])));
      return next;
    });
  }, []);

  const removeDay = useCallback((day: string) => {
    setDays((current) => {
      const next = new Map(current);
      next.delete(day);
      return next;
    });
  }, []);

  const saveRange = useCallback((expenses: readonly Expense[]) => {
    const next = new Map<string, Map<string, number>>();
    for (const expense of expenses) {
      const day = toDateKey(expense.occurredAt);
      const selection = next.get(day) ?? new Map<string, number>();
      selection.set(expense.id, expense.total.amount);
      next.set(day, selection);
    }
    setRange(next);
  }, []);

  const value = useMemo(() => ({ days, range, saveDay, removeDay, saveRange }), [days, range, saveDay, removeDay, saveRange]);
  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft(): ReportDraftValue {
  const value = useContext(ReportDraftContext);
  if (!value) throw new Error('useReportDraft deve ser usado dentro de <ReportDraftProvider>');
  return value;
}

/** Ids e soma (centavos) das despesas dos dias escolhidos, opcionalmente só dentro de um período. */
export function summarizeSelection(selection: DraftSelection, period?: { start: string; end: string }) {
  const ids: string[] = [];
  let total = 0;
  for (const [day, expenses] of selection) {
    if (period && (day < period.start || day > period.end)) continue;
    for (const [id, amount] of expenses) {
      ids.push(id);
      total += amount;
    }
  }
  return { ids, total };
}
