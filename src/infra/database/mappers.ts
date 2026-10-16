import { z } from 'zod';

import type { AuditEntry } from '@/domain/entities/AuditEntry';
import { Expense, type ExpenseItem } from '@/domain/entities/Expense';
import type { ExpenseCategory, PaymentMethod } from '@/domain/entities/ExpenseCategory';
import { ExpenseReport, type ReportStatus } from '@/domain/entities/ExpenseReport';
import type { OcrResult } from '@/domain/entities/OcrResult';
import { isCurrencyCode, Money, type CurrencyCode } from '@/domain/shared/Money';

import type { auditEntries, expenseItems, expenses, reports } from './schema';

type ExpenseRow = typeof expenses.$inferSelect;
type ItemRow = typeof expenseItems.$inferSelect;
type ReportRow = typeof reports.$inferSelect;
type AuditRow = typeof auditEntries.$inferSelect;

const changesSchema = z.array(
  z.object({
    field: z.string(),
    from: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    to: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  }),
);

function currency(value: string): CurrencyCode {
  if (!isCurrencyCode(value)) throw new Error(`Moeda desconhecida no banco local: ${value}`);
  return value;
}

export function auditFromRow(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    action: row.action as AuditEntry['action'],
    actorId: row.actorId,
    at: row.at,
    targetId: row.targetId,
    reason: row.reason,
    changes: changesSchema.parse(JSON.parse(row.changes)),
  };
}

export function auditToRows(entityType: 'EXPENSE' | 'REPORT', entityId: string, history: readonly AuditEntry[]): AuditRow[] {
  return history.map((entry, position) => ({
    id: entry.id,
    entityType,
    entityId,
    position,
    action: entry.action,
    actorId: entry.actorId,
    at: entry.at,
    targetId: entry.targetId,
    reason: entry.reason,
    changes: JSON.stringify(entry.changes),
  }));
}

export function expenseFromRows(row: ExpenseRow, items: ItemRow[], history: AuditRow[]): Expense {
  const code = currency(row.currency);
  return Expense.restore({
    id: row.id,
    ownerId: row.ownerId,
    reportId: row.reportId,
    description: row.description,
    category: row.category as ExpenseCategory,
    merchant: row.merchantName ? { name: row.merchantName, taxId: row.merchantTaxId } : null,
    occurredAt: row.occurredAt,
    paymentMethod: row.paymentMethod as PaymentMethod | null,
    notes: row.notes,
    currency: code,
    items: [...items]
      .sort((a, b) => a.position - b.position)
      .map(
        (item): ExpenseItem => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: Money.of(item.unitPrice, code),
          total: Money.of(item.total, code),
          status: item.status as ExpenseItem['status'],
          source: item.source as ExpenseItem['source'],
          removalReason: item.removalReason,
        }),
      ),
    discount: Money.of(row.discount, code),
    receipt: row.receiptLocalUri
      ? { localUri: row.receiptLocalUri, mimeType: row.receiptMimeType ?? 'image/jpeg', remoteId: row.receiptRemoteId }
      : null,
    ocrStatus: row.ocrStatus as Expense['ocrStatus'],
    ocrError: row.ocrError,
    ocrSnapshot: row.ocrSnapshot ? (JSON.parse(row.ocrSnapshot) as OcrResult) : null,
    locked: row.locked,
    history: [...history].sort((a, b) => a.position - b.position).map(auditFromRow),
    syncStatus: row.syncStatus as Expense['syncStatus'],
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function expenseToRow(expense: Expense): ExpenseRow {
  const p = expense.toProps();
  return {
    id: p.id,
    ownerId: p.ownerId,
    reportId: p.reportId,
    description: p.description,
    category: p.category,
    merchantName: p.merchant?.name ?? null,
    merchantTaxId: p.merchant?.taxId ?? null,
    occurredAt: p.occurredAt,
    paymentMethod: p.paymentMethod,
    notes: p.notes,
    currency: p.currency,
    discount: p.discount.amount,
    total: expense.total.amount,
    receiptLocalUri: p.receipt?.localUri ?? null,
    receiptMimeType: p.receipt?.mimeType ?? null,
    receiptRemoteId: p.receipt?.remoteId ?? null,
    ocrStatus: p.ocrStatus,
    ocrError: p.ocrError,
    ocrSnapshot: p.ocrSnapshot ? JSON.stringify(p.ocrSnapshot) : null,
    locked: p.locked,
    syncStatus: p.syncStatus,
    version: p.version,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export function itemsToRows(expense: Expense): ItemRow[] {
  return expense.items.map((item, position) => ({
    id: item.id,
    expenseId: expense.id,
    position,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice.amount,
    total: item.total.amount,
    status: item.status,
    source: item.source,
    removalReason: item.removalReason,
  }));
}

export function reportFromRows(row: ReportRow, history: AuditRow[]): ExpenseReport {
  const code = currency(row.currency);
  return ExpenseReport.restore({
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    purpose: row.purpose,
    costCenter: row.costCenter,
    startDate: row.startDate,
    endDate: row.endDate,
    advance: row.advance !== null ? Money.of(row.advance, code) : null,
    currency: code,
    status: row.status as ReportStatus,
    submittedAt: row.submittedAt,
    decidedAt: row.decidedAt,
    decisionNote: row.decisionNote,
    history: [...history].sort((a, b) => a.position - b.position).map(auditFromRow),
    syncStatus: row.syncStatus as ExpenseReport['syncStatus'],
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function reportToRow(report: ExpenseReport): ReportRow {
  const p = report.toProps();
  return {
    id: p.id,
    ownerId: p.ownerId,
    title: p.title,
    purpose: p.purpose,
    costCenter: p.costCenter,
    startDate: p.startDate,
    endDate: p.endDate,
    advance: p.advance?.amount ?? null,
    currency: p.currency,
    status: p.status,
    submittedAt: p.submittedAt,
    decidedAt: p.decidedAt,
    decisionNote: p.decisionNote,
    syncStatus: p.syncStatus,
    version: p.version,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
