import { DomainError, ValidationError } from '@/core/errors';
import type { ChangeContext } from '@/core/ports';

import { Money, type CurrencyCode } from '../shared/Money';
import { createAuditEntry, diffFields, type AuditEntry, type AuditValue } from './AuditEntry';
import type { ExpenseCategory, PaymentMethod } from './ExpenseCategory';
import type { OcrResult } from './OcrResult';

export type ItemStatus = 'ACTIVE' | 'REMOVED';
export type ItemSource = 'OCR' | 'MANUAL';
export type OcrStatus = 'NOT_REQUESTED' | 'PENDING' | 'DONE' | 'FAILED';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface ExpenseItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly total: Money;
  readonly status: ItemStatus;
  readonly source: ItemSource;
  readonly removalReason: string | null;
}

export interface Merchant {
  readonly name: string;
  readonly taxId: string | null;
}

export interface Receipt {
  readonly localUri: string;
  readonly mimeType: string;
  /** Id do comprovante no servidor; `null` enquanto não foi enviado. */
  readonly remoteId: string | null;
}

export interface ExpenseProps {
  readonly id: string;
  readonly ownerId: string;
  readonly reportId: string | null;
  readonly description: string;
  readonly category: ExpenseCategory;
  readonly merchant: Merchant | null;
  readonly occurredAt: string;
  readonly paymentMethod: PaymentMethod | null;
  readonly notes: string | null;
  readonly currency: CurrencyCode;
  readonly items: readonly ExpenseItem[];
  /** Desconto da nota inteira. O efetivo é proporcional aos itens ativos (ver `effectiveDiscount`). */
  readonly discount: Money;
  readonly receipt: Receipt | null;
  readonly ocrStatus: OcrStatus;
  readonly ocrError: string | null;
  /** Leitura original do OCR, preservada para auditoria. */
  readonly ocrSnapshot: OcrResult | null;
  /** Verdadeiro após a aprovação do relatório: nenhuma alteração é permitida. */
  readonly locked: boolean;
  readonly history: readonly AuditEntry[];
  readonly syncStatus: SyncStatus;
  /** Incrementa a cada alteração; usado para concorrência otimista na sincronização. */
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  /** Se omitido, é calculado como quantidade × preço unitário. */
  total?: number;
}

export interface ItemPatch {
  description?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export interface DetailsPatch {
  description?: string;
  category?: ExpenseCategory;
  merchantName?: string | null;
  merchantTaxId?: string | null;
  occurredAt?: string;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
  discount?: number;
}

export const EXPENSE_LIMITS = {
  descriptionMax: 200,
  notesMax: 1000,
  reasonMax: 300,
  itemsMax: 200,
  quantityMax: 100_000,
  amountMax: 100_000_000_00,
} as const;

/** Campos do histórico cujo valor está em centavos (a UI usa para formatar). */
export const MONEY_AUDIT_FIELDS: ReadonlySet<string> = new Set(['unitPrice', 'total', 'discount', 'amount']);

/**
 * Agregado Despesa. Imutável: cada operação devolve uma nova instância com o
 * histórico atualizado, o que facilita testes e o cache da UI.
 */
export class Expense {
  private constructor(private readonly props: ExpenseProps) {}

  static restore(props: ExpenseProps): Expense {
    return new Expense(props);
  }

  static createManual(
    input: {
      ownerId: string;
      description: string;
      amount: number;
      category: ExpenseCategory;
      occurredAt: string;
      paymentMethod?: PaymentMethod | null;
      merchantName?: string | null;
      notes?: string | null;
      currency: CurrencyCode;
    },
    ctx: ChangeContext,
  ): Expense {
    const description = requireText('description', input.description, EXPENSE_LIMITS.descriptionMax);
    const amount = requireAmount('amount', input.amount, input.currency);
    const now = ctx.now.toISOString();
    const id = ctx.newId();

    return new Expense({
      id,
      ownerId: input.ownerId,
      reportId: null,
      description,
      category: input.category,
      merchant: input.merchantName?.trim() ? { name: input.merchantName.trim(), taxId: null } : null,
      occurredAt: requireDate('occurredAt', input.occurredAt),
      paymentMethod: input.paymentMethod ?? null,
      notes: optionalText('notes', input.notes, EXPENSE_LIMITS.notesMax),
      currency: input.currency,
      items: [
        {
          id: ctx.newId(),
          description,
          quantity: 1,
          unitPrice: amount,
          total: amount,
          status: 'ACTIVE',
          source: 'MANUAL',
          removalReason: null,
        },
      ],
      discount: Money.zero(input.currency),
      receipt: null,
      ocrStatus: 'NOT_REQUESTED',
      ocrError: null,
      ocrSnapshot: null,
      locked: false,
      history: [createAuditEntry(ctx, 'EXPENSE_CREATED', { targetId: id, reason: 'MANUAL' })],
      syncStatus: 'PENDING',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createFromReceipt(
    input: { ownerId: string; receipt: Omit<Receipt, 'remoteId'>; currency: CurrencyCode },
    ctx: ChangeContext,
  ): Expense {
    const now = ctx.now.toISOString();
    const id = ctx.newId();
    return new Expense({
      id,
      ownerId: input.ownerId,
      reportId: null,
      description: '',
      category: 'OTHER',
      merchant: null,
      occurredAt: now,
      paymentMethod: null,
      notes: null,
      currency: input.currency,
      items: [],
      discount: Money.zero(input.currency),
      receipt: { ...input.receipt, remoteId: null },
      ocrStatus: 'PENDING',
      ocrError: null,
      ocrSnapshot: null,
      locked: false,
      history: [createAuditEntry(ctx, 'EXPENSE_CREATED', { targetId: id, reason: 'RECEIPT' })],
      syncStatus: 'PENDING',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ---------- Leitura ----------

  get id(): string {
    return this.props.id;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get reportId(): string | null {
    return this.props.reportId;
  }
  get description(): string {
    return this.props.description;
  }
  get category(): ExpenseCategory {
    return this.props.category;
  }
  get merchant(): Merchant | null {
    return this.props.merchant;
  }
  get occurredAt(): string {
    return this.props.occurredAt;
  }
  get paymentMethod(): PaymentMethod | null {
    return this.props.paymentMethod;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get currency(): CurrencyCode {
    return this.props.currency;
  }
  get items(): readonly ExpenseItem[] {
    return this.props.items;
  }
  get activeItems(): readonly ExpenseItem[] {
    return this.props.items.filter((item) => item.status === 'ACTIVE');
  }
  get removedItems(): readonly ExpenseItem[] {
    return this.props.items.filter((item) => item.status === 'REMOVED');
  }
  get discount(): Money {
    return this.props.discount;
  }
  get receipt(): Receipt | null {
    return this.props.receipt;
  }
  get ocrStatus(): OcrStatus {
    return this.props.ocrStatus;
  }
  get ocrError(): string | null {
    return this.props.ocrError;
  }
  get ocrSnapshot(): OcrResult | null {
    return this.props.ocrSnapshot;
  }
  get locked(): boolean {
    return this.props.locked;
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

  /** Soma de todos os itens, inclusive os removidos (valor "da nota"). */
  get grossSubtotal(): Money {
    return Money.sum(this.props.items.map((item) => item.total), this.props.currency);
  }

  /** Soma apenas dos itens que entram no reembolso. */
  get subtotal(): Money {
    return Money.sum(this.activeItems.map((item) => item.total), this.props.currency);
  }

  /**
   * Desconto proporcional aos itens mantidos. Ex.: nota de R$ 100 com R$ 10 de desconto;
   * removendo R$ 50 em itens, o desconto efetivo cai para R$ 5.
   */
  get effectiveDiscount(): Money {
    const gross = this.grossSubtotal.amount;
    if (gross <= 0 || this.props.discount.isZero()) return Money.zero(this.props.currency);
    return this.props.discount.multiply(this.subtotal.amount / gross);
  }

  /** Valor final que entra na despesa / relatório. */
  get total(): Money {
    return this.subtotal.subtract(this.effectiveDiscount);
  }

  /** Quanto o colaborador retirou do valor original da nota. */
  get excludedAmount(): Money {
    const original = this.grossSubtotal.subtract(this.props.discount);
    return original.subtract(this.total);
  }

  get isEditable(): boolean {
    return !this.props.locked;
  }

  findItem(itemId: string): ExpenseItem {
    const item = this.props.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new DomainError('NOT_FOUND', `Item ${itemId} não encontrado`, { entity: 'ExpenseItem' });
    return item;
  }

  toProps(): ExpenseProps {
    return this.props;
  }

  // ---------- OCR ----------

  /**
   * Aplica a leitura do OCR. Se o colaborador já preencheu a despesa manualmente
   * enquanto aguardava, os dados dele são mantidos e a leitura fica só como referência.
   */
  applyOcrResult(result: OcrResult, ctx: ChangeContext): Expense {
    this.assertEditable();
    if (result.currency !== this.props.currency) {
      throw new ValidationError('currency', 'A moeda da nota difere da moeda da despesa');
    }

    if (this.props.items.length > 0) {
      return this.change(ctx, { ocrStatus: 'DONE', ocrError: null, ocrSnapshot: result }, [
        createAuditEntry(ctx, 'OCR_APPLIED', { targetId: this.id, reason: 'MANUAL_DATA_KEPT' }),
      ]);
    }

    const items: ExpenseItem[] = result.items.slice(0, EXPENSE_LIMITS.itemsMax).map((item) => ({
      id: ctx.newId(),
      description: item.description.trim().slice(0, EXPENSE_LIMITS.descriptionMax) || '—',
      quantity: item.quantity > 0 ? item.quantity : 1,
      unitPrice: Money.of(Math.max(0, Math.round(item.unitPrice)), this.props.currency),
      total: Money.of(Math.max(0, Math.round(item.total)), this.props.currency),
      status: 'ACTIVE',
      source: 'OCR',
      removalReason: null,
    }));

    // Nota sem itens legíveis: cria um item único com o total lido.
    if (items.length === 0 && result.total > 0) {
      const total = Money.of(Math.round(result.total), this.props.currency);
      items.push({
        id: ctx.newId(),
        description: result.merchant?.name ?? '—',
        quantity: 1,
        unitPrice: total,
        total,
        status: 'ACTIVE',
        source: 'OCR',
        removalReason: null,
      });
    }

    const gross = Money.sum(items.map((item) => item.total), this.props.currency);
    const discount = Money.of(Math.min(Math.max(0, Math.round(result.discount)), gross.amount), this.props.currency);

    return this.change(
      ctx,
      {
        description: result.merchant?.name.slice(0, EXPENSE_LIMITS.descriptionMax) ?? this.props.description,
        merchant: result.merchant,
        occurredAt: result.occurredAt ?? this.props.occurredAt,
        paymentMethod: result.paymentMethod ?? this.props.paymentMethod,
        category: result.suggestedCategory ?? this.props.category,
        items,
        discount,
        ocrStatus: 'DONE',
        ocrError: null,
        ocrSnapshot: result,
      },
      [createAuditEntry(ctx, 'OCR_APPLIED', { targetId: this.id })],
    );
  }

  markOcrFailed(reason: string, ctx: ChangeContext): Expense {
    if (this.props.locked) return this;
    return this.change(ctx, { ocrStatus: 'FAILED', ocrError: reason.slice(0, EXPENSE_LIMITS.reasonMax) }, [
      createAuditEntry(ctx, 'OCR_FAILED', { targetId: this.id, reason: reason.slice(0, EXPENSE_LIMITS.reasonMax) }),
    ]);
  }

  /** Nova tentativa de leitura após falha. */
  requestOcrRetry(ctx: ChangeContext): Expense {
    this.assertEditable();
    if (!this.props.receipt) throw new DomainError('INVALID_STATE', 'Despesa sem comprovante');
    if (this.props.ocrStatus !== 'FAILED') return this;
    return this.change(ctx, { ocrStatus: 'PENDING', ocrError: null }, []);
  }

  /** Marca o comprovante como enviado ao servidor (operação técnica, sem auditoria). */
  withReceiptUploaded(remoteId: string): Expense {
    if (!this.props.receipt) return this;
    return new Expense({ ...this.props, receipt: { ...this.props.receipt, remoteId } });
  }

  // ---------- Edição ----------

  updateDetails(patch: DetailsPatch, ctx: ChangeContext): Expense {
    this.assertEditable();

    const next: Partial<Record<string, AuditValue>> = {};
    if (patch.description !== undefined) {
      next.description = requireText('description', patch.description, EXPENSE_LIMITS.descriptionMax);
    }
    if (patch.category !== undefined) next.category = patch.category;
    if (patch.merchantName !== undefined) {
      next.merchantName = optionalText('merchantName', patch.merchantName, EXPENSE_LIMITS.descriptionMax);
    }
    if (patch.merchantTaxId !== undefined) next.merchantTaxId = normalizeTaxId(patch.merchantTaxId);
    if (patch.occurredAt !== undefined) next.occurredAt = requireDate('occurredAt', patch.occurredAt);
    if (patch.paymentMethod !== undefined) next.paymentMethod = patch.paymentMethod;
    if (patch.notes !== undefined) next.notes = optionalText('notes', patch.notes, EXPENSE_LIMITS.notesMax);
    if (patch.discount !== undefined) {
      const discount = requireAmount('discount', patch.discount, this.props.currency);
      if (discount.greaterThan(this.grossSubtotal)) {
        throw new ValidationError('discount', 'O desconto não pode ser maior que o valor dos itens');
      }
      next.discount = discount.amount;
    }

    const changes = diffFields(this.auditableDetails(), next);
    if (changes.length === 0) return this;

    const merchantName = 'merchantName' in next ? (next.merchantName as string | null) : this.props.merchant?.name ?? null;
    const merchantTaxId =
      'merchantTaxId' in next ? (next.merchantTaxId as string | null) : this.props.merchant?.taxId ?? null;

    return this.change(
      ctx,
      {
        description: (next.description as string | undefined) ?? this.props.description,
        category: patch.category ?? this.props.category,
        merchant: merchantName ? { name: merchantName, taxId: merchantTaxId } : null,
        occurredAt: (next.occurredAt as string | undefined) ?? this.props.occurredAt,
        paymentMethod: patch.paymentMethod !== undefined ? patch.paymentMethod : this.props.paymentMethod,
        notes: 'notes' in next ? (next.notes as string | null) : this.props.notes,
        discount: next.discount !== undefined ? Money.of(next.discount as number, this.props.currency) : this.props.discount,
      },
      [createAuditEntry(ctx, 'DETAILS_UPDATED', { targetId: this.id, changes })],
    );
  }

  addItem(input: NewItemInput, ctx: ChangeContext): Expense {
    this.assertEditable();
    if (this.props.items.length >= EXPENSE_LIMITS.itemsMax) {
      throw new ValidationError('items', 'Limite de itens atingido', { max: EXPENSE_LIMITS.itemsMax });
    }
    const description = requireText('description', input.description, EXPENSE_LIMITS.descriptionMax);
    const quantity = requireQuantity(input.quantity);
    const unitPrice = requireAmount('unitPrice', input.unitPrice, this.props.currency);
    const total =
      input.total !== undefined ? requireAmount('total', input.total, this.props.currency) : unitPrice.multiply(quantity);

    const item: ExpenseItem = {
      id: ctx.newId(),
      description,
      quantity,
      unitPrice,
      total,
      status: 'ACTIVE',
      source: 'MANUAL',
      removalReason: null,
    };

    return this.change(ctx, { items: [...this.props.items, item] }, [
      createAuditEntry(ctx, 'ITEM_ADDED', {
        targetId: item.id,
        changes: [
          { field: 'description', from: null, to: description },
          { field: 'total', from: null, to: total.amount },
        ],
      }),
    ]);
  }

  updateItem(itemId: string, patch: ItemPatch, ctx: ChangeContext): Expense {
    this.assertEditable();
    const current = this.findItem(itemId);
    if (current.status === 'REMOVED') {
      throw new DomainError('INVALID_STATE', 'Restaure o item antes de editá-lo');
    }

    const description =
      patch.description !== undefined
        ? requireText('description', patch.description, EXPENSE_LIMITS.descriptionMax)
        : current.description;
    const quantity = patch.quantity !== undefined ? requireQuantity(patch.quantity) : current.quantity;
    const unitPrice =
      patch.unitPrice !== undefined
        ? requireAmount('unitPrice', patch.unitPrice, this.props.currency)
        : current.unitPrice;

    const priceChanged = patch.quantity !== undefined || patch.unitPrice !== undefined;
    const total =
      patch.total !== undefined
        ? requireAmount('total', patch.total, this.props.currency)
        : priceChanged
          ? unitPrice.multiply(quantity)
          : current.total;

    const updated: ExpenseItem = { ...current, description, quantity, unitPrice, total };
    const changes = diffFields(itemAuditFields(current), itemAuditFields(updated));
    if (changes.length === 0) return this;

    return this.change(
      ctx,
      { items: this.props.items.map((item) => (item.id === itemId ? updated : item)) },
      [createAuditEntry(ctx, 'ITEM_UPDATED', { targetId: itemId, changes })],
    );
  }

  /**
   * Remove um item do reembolso. O item não é apagado: fica marcado como removido
   * (com motivo opcional) para o gestor ver, e o total é recalculado.
   */
  removeItem(itemId: string, reason: string | null, ctx: ChangeContext): Expense {
    this.assertEditable();
    const current = this.findItem(itemId);
    if (current.status === 'REMOVED') return this;

    const removalReason = optionalText('reason', reason, EXPENSE_LIMITS.reasonMax);
    const before = this.total;
    const next = this.change(
      ctx,
      {
        items: this.props.items.map((item) =>
          item.id === itemId ? { ...item, status: 'REMOVED' as const, removalReason } : item,
        ),
      },
      [],
    );
    return next.appendHistory(
      createAuditEntry(ctx, 'ITEM_REMOVED', {
        targetId: itemId,
        reason: removalReason,
        changes: [{ field: 'total', from: before.amount, to: next.total.amount }],
      }),
    );
  }

  restoreItem(itemId: string, ctx: ChangeContext): Expense {
    this.assertEditable();
    const current = this.findItem(itemId);
    if (current.status === 'ACTIVE') return this;

    const before = this.total;
    const next = this.change(
      ctx,
      {
        items: this.props.items.map((item) =>
          item.id === itemId ? { ...item, status: 'ACTIVE' as const, removalReason: null } : item,
        ),
      },
      [],
    );
    return next.appendHistory(
      createAuditEntry(ctx, 'ITEM_RESTORED', {
        targetId: itemId,
        changes: [{ field: 'total', from: before.amount, to: next.total.amount }],
      }),
    );
  }

  // ---------- Relatório ----------

  attachToReport(reportId: string, ctx: ChangeContext): Expense {
    this.assertEditable();
    if (this.props.reportId === reportId) return this;
    if (this.props.reportId) {
      throw new DomainError('INVALID_STATE', 'A despesa já pertence a outro relatório');
    }
    return this.change(ctx, { reportId }, [
      createAuditEntry(ctx, 'ATTACHED_TO_REPORT', { targetId: reportId }),
    ]);
  }

  detachFromReport(ctx: ChangeContext): Expense {
    this.assertEditable();
    if (!this.props.reportId) return this;
    return this.change(ctx, { reportId: null }, [
      createAuditEntry(ctx, 'DETACHED_FROM_REPORT', { targetId: this.props.reportId }),
    ]);
  }

  /** Chamado quando o relatório é aprovado: a despesa passa a ser somente leitura. */
  lock(): Expense {
    if (this.props.locked) return this;
    return new Expense({ ...this.props, locked: true });
  }

  // ---------- Sincronização ----------

  markSynced(): Expense {
    return new Expense({ ...this.props, syncStatus: 'SYNCED' });
  }

  markSyncFailed(): Expense {
    return new Expense({ ...this.props, syncStatus: 'FAILED' });
  }

  // ---------- Internos ----------

  private assertEditable(): void {
    if (this.props.locked) {
      throw new DomainError('LOCKED', 'Despesa de relatório aprovado não pode ser alterada');
    }
  }

  private change(ctx: ChangeContext, patch: Partial<ExpenseProps>, entries: AuditEntry[]): Expense {
    return new Expense({
      ...this.props,
      ...patch,
      history: [...this.props.history, ...entries],
      syncStatus: 'PENDING',
      version: this.props.version + 1,
      updatedAt: ctx.now.toISOString(),
    });
  }

  private appendHistory(entry: AuditEntry): Expense {
    return new Expense({ ...this.props, history: [...this.props.history, entry] });
  }

  private auditableDetails(): Record<string, AuditValue> {
    return {
      description: this.props.description,
      category: this.props.category,
      merchantName: this.props.merchant?.name ?? null,
      merchantTaxId: this.props.merchant?.taxId ?? null,
      occurredAt: this.props.occurredAt,
      paymentMethod: this.props.paymentMethod,
      notes: this.props.notes,
      discount: this.props.discount.amount,
    };
  }
}

// ---------- Validações ----------

function itemAuditFields(item: ExpenseItem): Record<string, AuditValue> {
  return {
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice.amount,
    total: item.total.amount,
  };
}

function requireText(field: string, value: string, max: number): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) throw new ValidationError(field, `${field} é obrigatório`);
  if (trimmed.length > max) throw new ValidationError(field, `${field} excede ${max} caracteres`, { max });
  return trimmed;
}

function optionalText(field: string, value: string | null | undefined, max: number): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.length > max) throw new ValidationError(field, `${field} excede ${max} caracteres`, { max });
  return trimmed;
}

function requireAmount(field: string, value: number, currency: CurrencyCode): Money {
  if (!Number.isSafeInteger(value) || value < 0 || value > EXPENSE_LIMITS.amountMax) {
    throw new ValidationError(field, `${field} inválido`);
  }
  return Money.of(value, currency);
}

function requireQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0 || value > EXPENSE_LIMITS.quantityMax) {
    throw new ValidationError('quantity', 'Quantidade inválida');
  }
  return Math.round(value * 1000) / 1000;
}

function requireDate(field: string, value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError(field, 'Data inválida');
  return date.toISOString();
}

function normalizeTaxId(value: string | null): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14 && digits.length !== 11) {
    throw new ValidationError('merchantTaxId', 'CNPJ/CPF inválido');
  }
  return digits;
}
