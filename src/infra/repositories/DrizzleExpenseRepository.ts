import { and, asc, desc, eq, gte, inArray, isNull, lte, type SQL } from 'drizzle-orm';

import type { Expense } from '@/domain/entities/Expense';
import type { ExpenseFilter, ExpenseRepository } from '@/domain/repositories/ExpenseRepository';

import type { Database } from '../database/client';
import { auditToRows, expenseFromRows, expenseToRow, itemsToRows } from '../database/mappers';
import { auditEntries, expenseItems, expenses } from '../database/schema';

type ExpenseRow = typeof expenses.$inferSelect;

export class DrizzleExpenseRepository implements ExpenseRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<Expense | null> {
    const row = this.db.select().from(expenses).where(eq(expenses.id, id)).get();
    if (!row) return null;
    return this.hydrate([row])[0];
  }

  async list(filter: ExpenseFilter): Promise<Expense[]> {
    const conditions: SQL[] = [eq(expenses.ownerId, filter.ownerId)];
    if (filter.from) conditions.push(gte(expenses.occurredAt, filter.from));
    if (filter.to) conditions.push(lte(expenses.occurredAt, filter.to));
    if (filter.unassignedOnly) conditions.push(isNull(expenses.reportId));
    if (filter.ocrFailedOnly) conditions.push(eq(expenses.ocrStatus, 'FAILED'));

    const rows = this.db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.occurredAt))
      .all();
    return this.hydrate(rows);
  }

  async listByReport(reportId: string): Promise<Expense[]> {
    const rows = this.db
      .select()
      .from(expenses)
      .where(eq(expenses.reportId, reportId))
      .orderBy(asc(expenses.occurredAt))
      .all();
    return this.hydrate(rows);
  }

  async save(expense: Expense): Promise<void> {
    await this.saveMany([expense]);
  }

  async saveMany(list: readonly Expense[]): Promise<void> {
    if (list.length === 0) return;
    this.db.transaction((tx) => {
      for (const expense of list) {
        const row = expenseToRow(expense);
        tx.insert(expenses).values(row).onConflictDoUpdate({ target: expenses.id, set: row }).run();

        // Itens: o agregado é a fonte da verdade, então substituímos o conjunto inteiro.
        tx.delete(expenseItems).where(eq(expenseItems.expenseId, expense.id)).run();
        const items = itemsToRows(expense);
        if (items.length > 0) tx.insert(expenseItems).values(items).run();

        // Histórico é append-only: só insere entradas novas.
        const history = auditToRows('EXPENSE', expense.id, expense.history);
        if (history.length > 0) tx.insert(auditEntries).values(history).onConflictDoNothing().run();
      }
    });
  }

  async delete(id: string): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(expenseItems).where(eq(expenseItems.expenseId, id)).run();
      tx.delete(auditEntries).where(and(eq(auditEntries.entityType, 'EXPENSE'), eq(auditEntries.entityId, id))).run();
      tx.delete(expenses).where(eq(expenses.id, id)).run();
    });
  }

  async markSynced(id: string, version: number): Promise<void> {
    this.db
      .update(expenses)
      .set({ syncStatus: 'SYNCED' })
      .where(and(eq(expenses.id, id), eq(expenses.version, version)))
      .run();
  }

  /** Carrega itens e histórico em lote (2 consultas) para evitar N+1. */
  private hydrate(rows: ExpenseRow[]): Expense[] {
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.id);

    const items = this.db.select().from(expenseItems).where(inArray(expenseItems.expenseId, ids)).all();
    const history = this.db
      .select()
      .from(auditEntries)
      .where(and(eq(auditEntries.entityType, 'EXPENSE'), inArray(auditEntries.entityId, ids)))
      .all();

    return rows.map((row) =>
      expenseFromRows(
        row,
        items.filter((item) => item.expenseId === row.id),
        history.filter((entry) => entry.entityId === row.id),
      ),
    );
  }
}
