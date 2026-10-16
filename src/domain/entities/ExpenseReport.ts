import { DomainError, ValidationError } from '@/core/errors';
import type { ChangeContext } from '@/core/ports';

import { Money, type CurrencyCode } from '../shared/Money';
import { createAuditEntry, diffFields, type AuditEntry, type AuditValue } from './AuditEntry';
import type { SyncStatus } from './Expense';

/**
 * - DRAFT: em montagem pelo colaborador.
 * - SUBMITTED: enviado ao gestor; ainda pode ser editado (tudo fica no histórico).
 * - APPROVED: imutável.
 * - REJECTED: reservado — o fluxo de reprovação ainda não foi definido; por ora é tratado como bloqueado.
 */
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface ExpenseReportProps {
  readonly id: string;
  readonly ownerId: string;
  readonly title: string;
  readonly purpose: string | null;
  readonly costCenter: string | null;
  /** Datas no formato YYYY-MM-DD (dia local). */
  readonly startDate: string;
  readonly endDate: string;
  /** Adiantamento recebido para a viagem/período. */
  readonly advance: Money | null;
  readonly currency: CurrencyCode;
  readonly status: ReportStatus;
  readonly submittedAt: string | null;
  readonly decidedAt: string | null;
  readonly decisionNote: string | null;
  readonly history: readonly AuditEntry[];
  readonly syncStatus: SyncStatus;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReportDetailsInput {
  title: string;
  purpose?: string | null;
  costCenter?: string | null;
  startDate: string;
  endDate: string;
  advance?: number | null;
}

export const REPORT_LIMITS = {
  titleMax: 120,
  purposeMax: 500,
  costCenterMax: 40,
  maxPeriodDays: 366,
} as const;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class ExpenseReport {
  private constructor(private readonly props: ExpenseReportProps) {}

  static restore(props: ExpenseReportProps): ExpenseReport {
    return new ExpenseReport(props);
  }

  static create(input: ReportDetailsInput & { ownerId: string; currency: CurrencyCode }, ctx: ChangeContext): ExpenseReport {
    const details = validateDetails(input, input.currency);
    const now = ctx.now.toISOString();
    const id = ctx.newId();
    return new ExpenseReport({
      id,
      ownerId: input.ownerId,
      ...details,
      currency: input.currency,
      status: 'DRAFT',
      submittedAt: null,
      decidedAt: null,
      decisionNote: null,
      history: [createAuditEntry(ctx, 'REPORT_CREATED', { targetId: id })],
      syncStatus: 'PENDING',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get title(): string {
    return this.props.title;
  }
  get purpose(): string | null {
    return this.props.purpose;
  }
  get costCenter(): string | null {
    return this.props.costCenter;
  }
  get startDate(): string {
    return this.props.startDate;
  }
  get endDate(): string {
    return this.props.endDate;
  }
  get advance(): Money | null {
    return this.props.advance;
  }
  get currency(): CurrencyCode {
    return this.props.currency;
  }
  get status(): ReportStatus {
    return this.props.status;
  }
  get submittedAt(): string | null {
    return this.props.submittedAt;
  }
  get decidedAt(): string | null {
    return this.props.decidedAt;
  }
  get decisionNote(): string | null {
    return this.props.decisionNote;
  }
  get history(): readonly AuditEntry[] {
    return this.props.history;
  }
  get syncStatus(): SyncStatus {
    return this.props.syncStatus;
  }
  get version(): number {
    return this.props.version;
  }
  get createdAt(): string {
    return this.props.createdAt;
  }
  get updatedAt(): string {
    return this.props.updatedAt;
  }

  /** Pode ser editado até a aprovação (inclusive depois de enviado). */
  get isEditable(): boolean {
    return this.props.status === 'DRAFT' || this.props.status === 'SUBMITTED';
  }

  get isDeletable(): boolean {
    return this.props.status === 'DRAFT';
  }

  /** Verdadeiro se a data (YYYY-MM-DD) está dentro do período do relatório. */
  coversDate(dateKey: string): boolean {
    return dateKey >= this.props.startDate && dateKey <= this.props.endDate;
  }

  toProps(): ExpenseReportProps {
    return this.props;
  }

  assertEditable(): void {
    if (!this.isEditable) {
      throw new DomainError('LOCKED', 'Relatório aprovado não pode ser alterado', { status: this.props.status });
    }
  }

  update(input: ReportDetailsInput, ctx: ChangeContext): ExpenseReport {
    this.assertEditable();
    const details = validateDetails(input, this.props.currency);
    const before: Record<string, AuditValue> = {
      title: this.props.title,
      purpose: this.props.purpose,
      costCenter: this.props.costCenter,
      startDate: this.props.startDate,
      endDate: this.props.endDate,
      advance: this.props.advance?.amount ?? null,
    };
    const changes = diffFields(before, { ...details, advance: details.advance?.amount ?? null });
    if (changes.length === 0) return this;

    return this.change(ctx, details, [createAuditEntry(ctx, 'REPORT_UPDATED', { targetId: this.id, changes })]);
  }

  submit(expenseCount: number, ctx: ChangeContext): ExpenseReport {
    if (this.props.status !== 'DRAFT') {
      throw new DomainError('INVALID_STATE', 'Somente relatórios em rascunho podem ser enviados', {
        status: this.props.status,
      });
    }
    if (expenseCount === 0) {
      throw new ValidationError('expenses', 'Adicione ao menos uma despesa antes de enviar');
    }
    const at = ctx.now.toISOString();
    return this.change(ctx, { status: 'SUBMITTED', submittedAt: at }, [
      createAuditEntry(ctx, 'REPORT_SUBMITTED', {
        targetId: this.id,
        changes: [{ field: 'status', from: 'DRAFT', to: 'SUBMITTED' }],
      }),
    ]);
  }

  /** Registra no histórico do relatório a entrada/saída de uma despesa. */
  recordExpense(action: 'REPORT_EXPENSE_ADDED' | 'REPORT_EXPENSE_REMOVED', expenseId: string, ctx: ChangeContext): ExpenseReport {
    this.assertEditable();
    return this.change(ctx, {}, [createAuditEntry(ctx, action, { targetId: expenseId })]);
  }

  /** Decisão vinda do servidor (aprovação feita pelo gestor em outro sistema). */
  applyDecision(
    decision: { status: 'APPROVED' | 'REJECTED'; decidedAt: string; note: string | null; decidedBy: string },
    ctx: ChangeContext,
  ): ExpenseReport {
    if (this.props.status === decision.status) return this;
    if (this.props.status !== 'SUBMITTED') {
      throw new DomainError('INVALID_STATE', 'Apenas relatórios enviados podem receber decisão');
    }
    const entry = createAuditEntry(
      { ...ctx, actorId: decision.decidedBy },
      decision.status === 'APPROVED' ? 'REPORT_APPROVED' : 'REPORT_REJECTED',
      {
        targetId: this.id,
        reason: decision.note,
        changes: [{ field: 'status', from: this.props.status, to: decision.status }],
      },
    );
    return new ExpenseReport({
      ...this.props,
      status: decision.status,
      decidedAt: decision.decidedAt,
      decisionNote: decision.note,
      history: [...this.props.history, entry],
      // A decisão veio do servidor: o estado local já está consistente com ele.
      syncStatus: 'SYNCED',
      updatedAt: ctx.now.toISOString(),
    });
  }

  markSynced(): ExpenseReport {
    return new ExpenseReport({ ...this.props, syncStatus: 'SYNCED' });
  }

  markSyncFailed(): ExpenseReport {
    return new ExpenseReport({ ...this.props, syncStatus: 'FAILED' });
  }

  private change(ctx: ChangeContext, patch: Partial<ExpenseReportProps>, entries: AuditEntry[]): ExpenseReport {
    return new ExpenseReport({
      ...this.props,
      ...patch,
      history: [...this.props.history, ...entries],
      syncStatus: 'PENDING',
      version: this.props.version + 1,
      updatedAt: ctx.now.toISOString(),
    });
  }
}

function validateDetails(
  input: ReportDetailsInput,
  currency: CurrencyCode,
): Pick<ExpenseReportProps, 'title' | 'purpose' | 'costCenter' | 'startDate' | 'endDate' | 'advance'> {
  const title = (input.title ?? '').trim();
  if (!title) throw new ValidationError('title', 'Título é obrigatório');
  if (title.length > REPORT_LIMITS.titleMax) {
    throw new ValidationError('title', 'Título muito longo', { max: REPORT_LIMITS.titleMax });
  }

  const purpose = (input.purpose ?? '').trim() || null;
  if (purpose && purpose.length > REPORT_LIMITS.purposeMax) {
    throw new ValidationError('purpose', 'Motivo muito longo', { max: REPORT_LIMITS.purposeMax });
  }

  const costCenter = (input.costCenter ?? '').trim() || null;
  if (costCenter && costCenter.length > REPORT_LIMITS.costCenterMax) {
    throw new ValidationError('costCenter', 'Centro de custo muito longo', { max: REPORT_LIMITS.costCenterMax });
  }

  if (!DATE_ONLY.test(input.startDate) || Number.isNaN(Date.parse(input.startDate))) {
    throw new ValidationError('startDate', 'Data inicial inválida');
  }
  if (!DATE_ONLY.test(input.endDate) || Number.isNaN(Date.parse(input.endDate))) {
    throw new ValidationError('endDate', 'Data final inválida');
  }
  if (input.endDate < input.startDate) {
    throw new ValidationError('endDate', 'A data final deve ser igual ou posterior à inicial');
  }
  const days = (Date.parse(input.endDate) - Date.parse(input.startDate)) / 86_400_000;
  if (days > REPORT_LIMITS.maxPeriodDays) {
    throw new ValidationError('endDate', 'Período muito longo', { max: REPORT_LIMITS.maxPeriodDays });
  }

  let advance: Money | null = null;
  if (input.advance !== undefined && input.advance !== null) {
    if (!Number.isSafeInteger(input.advance) || input.advance < 0) {
      throw new ValidationError('advance', 'Adiantamento inválido');
    }
    advance = input.advance > 0 ? Money.of(input.advance, currency) : null;
  }

  return { title, purpose, costCenter, startDate: input.startDate, endDate: input.endDate, advance };
}
