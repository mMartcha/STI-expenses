import type { Expense } from '../entities/Expense';

export interface ExpenseFilter {
  ownerId: string;
  /** ISO inclusive */
  from?: string;
  /** ISO inclusive */
  to?: string;
  /** Somente despesas avulsas (sem relatório). */
  unassignedOnly?: boolean;
  /** Somente despesas cuja leitura do OCR falhou. */
  ocrFailedOnly?: boolean;
}

export interface ExpenseRepository {
  findById(id: string): Promise<Expense | null>;
  list(filter: ExpenseFilter): Promise<Expense[]>;
  listByReport(reportId: string): Promise<Expense[]>;
  /** Insere ou atualiza o agregado completo (itens + histórico) de forma atômica. */
  save(expense: Expense): Promise<void>;
  saveMany(expenses: readonly Expense[]): Promise<void>;
  delete(id: string): Promise<void>;
  /** Marca como sincronizada somente se ninguém alterou a despesa depois do envio. */
  markSynced(id: string, version: number): Promise<void>;
}
