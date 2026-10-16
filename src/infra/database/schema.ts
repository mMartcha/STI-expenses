import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Esquema local (SQLite). Após alterar este arquivo rode `npm run db:generate`
 * para gerar a migration — nunca edite as migrations já publicadas.
 */

export const expenses = sqliteTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    reportId: text('report_id'),
    description: text('description').notNull(),
    category: text('category').notNull(),
    merchantName: text('merchant_name'),
    merchantTaxId: text('merchant_tax_id'),
    occurredAt: text('occurred_at').notNull(),
    paymentMethod: text('payment_method'),
    notes: text('notes'),
    currency: text('currency').notNull(),
    discount: integer('discount').notNull(),
    /** Desnormalizado para listagens rápidas; a fonte da verdade são os itens. */
    total: integer('total').notNull(),
    receiptLocalUri: text('receipt_local_uri'),
    receiptMimeType: text('receipt_mime_type'),
    receiptRemoteId: text('receipt_remote_id'),
    ocrStatus: text('ocr_status').notNull(),
    ocrError: text('ocr_error'),
    ocrSnapshot: text('ocr_snapshot'),
    locked: integer('locked', { mode: 'boolean' }).notNull(),
    syncStatus: text('sync_status').notNull(),
    version: integer('version').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('expenses_owner_date_idx').on(table.ownerId, table.occurredAt),
    index('expenses_report_idx').on(table.reportId),
  ],
);

export const expenseItems = sqliteTable(
  'expense_items',
  {
    id: text('id').primaryKey(),
    expenseId: text('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    description: text('description').notNull(),
    quantity: real('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    total: integer('total').notNull(),
    status: text('status').notNull(),
    source: text('source').notNull(),
    removalReason: text('removal_reason'),
  },
  (table) => [index('expense_items_expense_idx').on(table.expenseId)],
);

export const reports = sqliteTable(
  'reports',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    purpose: text('purpose'),
    costCenter: text('cost_center'),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    advance: integer('advance'),
    currency: text('currency').notNull(),
    status: text('status').notNull(),
    submittedAt: text('submitted_at'),
    decidedAt: text('decided_at'),
    decisionNote: text('decision_note'),
    syncStatus: text('sync_status').notNull(),
    version: integer('version').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('reports_owner_idx').on(table.ownerId, table.startDate)],
);

/** Histórico de auditoria de despesas e relatórios (append-only). */
export const auditEntries = sqliteTable(
  'audit_entries',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    position: integer('position').notNull(),
    action: text('action').notNull(),
    actorId: text('actor_id').notNull(),
    at: text('at').notNull(),
    targetId: text('target_id'),
    reason: text('reason'),
    changes: text('changes').notNull(),
  },
  (table) => [index('audit_entity_idx').on(table.entityType, table.entityId, table.position)],
);

/** Outbox: operações aguardando envio ao servidor. */
export const syncOperations = sqliteTable(
  'sync_operations',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    entityId: text('entity_id').notNull(),
    attempts: integer('attempts').notNull(),
    /** Incrementa quando a operação é reenfileirada durante um envio em andamento. */
    revision: integer('revision').notNull().default(0),
    nextAttemptAt: text('next_attempt_at').notNull(),
    lastError: text('last_error'),
    status: text('status').notNull(),
    createdAt: text('created_at').notNull(),
    /** Chave de deduplicação para upserts: `${type}:${entityId}`; nula para operações não deduplicáveis. */
    dedupeKey: text('dedupe_key'),
  },
  (table) => [
    index('sync_due_idx').on(table.status, table.nextAttemptAt),
    uniqueIndex('sync_dedupe_idx').on(table.dedupeKey),
  ],
);

/** Preferências locais simples (ex.: quando os avisos foram vistos). */
export const preferences = sqliteTable('preferences', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
