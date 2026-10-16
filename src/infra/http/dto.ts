import { z } from 'zod';

import type { Expense } from '@/domain/entities/Expense';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/domain/entities/ExpenseCategory';
import type { ExpenseReport } from '@/domain/entities/ExpenseReport';
import type { OcrResult } from '@/domain/entities/OcrResult';

/**
 * Contratos da API (provisórios até o backend ser definido).
 * Toda resposta passa por um schema Zod antes de virar objeto de domínio.
 */

const cents = z.number().int().nonnegative().max(10_000_000_000);

export const sessionDto = z.object({
  user: z.object({
    id: z.string().min(1),
    name: z.string().max(200),
    email: z.email(),
    role: z.enum(['EMPLOYEE', 'MANAGER']),
  }),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }),
});

export const receiptUploadDto = z.object({ receiptId: z.string().min(1) });

export const ocrResultDto = z
  .object({
    merchant: z.object({ name: z.string().min(1).max(200), taxId: z.string().max(20).nullable() }).nullable(),
    occurredAt: z.iso.datetime({ offset: true }).nullable(),
    paymentMethod: z.enum(PAYMENT_METHODS).nullable().catch(null),
    suggestedCategory: z.enum(EXPENSE_CATEGORIES).nullable().catch(null),
    currency: z.literal('BRL'),
    items: z
      .array(
        z.object({
          description: z.string().max(200),
          quantity: z.number().positive().max(100_000),
          unitPrice: cents,
          total: cents,
        }),
      )
      .max(200),
    discount: cents,
    total: cents,
    confidence: z.number().min(0).max(1),
  })
  .transform((dto): OcrResult => dto);

export const decisionsDto = z.array(
  z.object({
    reportId: z.string(),
    status: z.enum(['SUBMITTED', 'APPROVED', 'REJECTED']),
    decidedAt: z.iso.datetime({ offset: true }).nullable(),
    decidedBy: z.string().nullable(),
    note: z.string().max(1000).nullable(),
  }),
);

export function expenseToDto(expense: Expense) {
  return {
    id: expense.id,
    reportId: expense.reportId,
    description: expense.description,
    category: expense.category,
    merchant: expense.merchant,
    occurredAt: expense.occurredAt,
    paymentMethod: expense.paymentMethod,
    notes: expense.notes,
    currency: expense.currency,
    receiptId: expense.receipt?.remoteId ?? null,
    items: expense.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.amount,
      total: item.total.amount,
      status: item.status,
      source: item.source,
      removalReason: item.removalReason,
    })),
    discount: expense.discount.amount,
    effectiveDiscount: expense.effectiveDiscount.amount,
    total: expense.total.amount,
    ocrSnapshot: expense.ocrSnapshot,
    history: expense.history,
    version: expense.version,
    updatedAt: expense.updatedAt,
  };
}

export function reportToDto(report: ExpenseReport) {
  return {
    id: report.id,
    title: report.title,
    purpose: report.purpose,
    costCenter: report.costCenter,
    startDate: report.startDate,
    endDate: report.endDate,
    advance: report.advance?.amount ?? null,
    currency: report.currency,
    status: report.status,
    submittedAt: report.submittedAt,
    history: report.history,
    version: report.version,
    updatedAt: report.updatedAt,
  };
}
