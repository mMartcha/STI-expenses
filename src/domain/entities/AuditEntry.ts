import type { ChangeContext } from '@/core/ports';

export type AuditAction =
  | 'EXPENSE_CREATED'
  | 'OCR_APPLIED'
  | 'OCR_FAILED'
  | 'DETAILS_UPDATED'
  | 'ITEM_ADDED'
  | 'ITEM_UPDATED'
  | 'ITEM_REMOVED'
  | 'ITEM_RESTORED'
  | 'ATTACHED_TO_REPORT'
  | 'DETACHED_FROM_REPORT'
  | 'REPORT_CREATED'
  | 'REPORT_UPDATED'
  | 'REPORT_SUBMITTED'
  | 'REPORT_APPROVED'
  | 'REPORT_REJECTED'
  | 'REPORT_EXPENSE_ADDED'
  | 'REPORT_EXPENSE_REMOVED';

export type AuditValue = string | number | boolean | null;

export interface FieldChange {
  field: string;
  from: AuditValue;
  to: AuditValue;
}

/**
 * Registro imutável de uma alteração. É o que o gestor vê na aprovação:
 * quem mudou, quando, o quê (de → para) e, quando informado, o motivo.
 */
export interface AuditEntry {
  readonly id: string;
  readonly action: AuditAction;
  readonly actorId: string;
  readonly at: string;
  readonly targetId: string | null;
  readonly reason: string | null;
  readonly changes: readonly FieldChange[];
}

export function createAuditEntry(
  ctx: ChangeContext,
  action: AuditAction,
  options: { targetId?: string | null; reason?: string | null; changes?: FieldChange[] } = {},
): AuditEntry {
  return {
    id: ctx.newId(),
    action,
    actorId: ctx.actorId,
    at: ctx.now.toISOString(),
    targetId: options.targetId ?? null,
    reason: options.reason ?? null,
    changes: options.changes ?? [],
  };
}

/** Compara dois objetos rasos e devolve apenas os campos que mudaram. */
export function diffFields<T extends Record<string, AuditValue>>(before: T, after: Partial<T>): FieldChange[] {
  return (Object.keys(after) as (keyof T & string)[])
    .filter((field) => after[field] !== undefined && after[field] !== before[field])
    .map((field) => ({ field, from: before[field], to: after[field] as AuditValue }));
}
