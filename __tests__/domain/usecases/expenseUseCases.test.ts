import { CaptureReceiptUseCase } from '@/domain/usecases/expense/CaptureReceiptUseCase';
import { DeleteExpenseUseCase } from '@/domain/usecases/expense/DeleteExpenseUseCase';
import type { ExpenseMutationDeps } from '@/domain/usecases/expense/ExpenseMutation';
import { RemoveExpenseItemUseCase } from '@/domain/usecases/expense/RemoveExpenseItemUseCase';
import { ExpenseReport } from '@/domain/entities/ExpenseReport';

import {
  ctx,
  FakeReceiptStorage,
  FakeScheduler,
  FakeSessionRepository,
  FixedClock,
  InMemoryExpenseRepository,
  InMemoryReportRepository,
  InMemorySyncQueue,
  sampleOcr,
  SequentialIds,
} from '../../helpers/fakes';

function setup() {
  const clock = new FixedClock();
  const ids = new SequentialIds();
  const deps: ExpenseMutationDeps & { queue: InMemorySyncQueue; scheduler: FakeScheduler; expenses: InMemoryExpenseRepository; reports: InMemoryReportRepository } = {
    expenses: new InMemoryExpenseRepository(),
    reports: new InMemoryReportRepository(),
    queue: new InMemorySyncQueue(clock),
    scheduler: new FakeScheduler(),
    sessions: new FakeSessionRepository(),
    clock,
    ids,
  };
  const receipts = new FakeReceiptStorage();
  const capture = new CaptureReceiptUseCase(deps.expenses, receipts, deps.queue, deps.scheduler, deps.sessions, clock, ids);
  return { deps, receipts, capture, clock, ids };
}

describe('CaptureReceiptUseCase', () => {
  it('salva a foto, cria a despesa aguardando leitura e coloca o OCR na fila', async () => {
    const { deps, capture } = setup();
    const expense = await capture.execute({ kind: 'file', sourceUri: 'file:///tmp/photo.jpg', mimeType: 'image/jpeg' });

    expect(expense.ocrStatus).toBe('PENDING');
    expect(expense.receipt?.localUri).toBe('file:///receipts/photo.jpg');
    expect(await deps.expenses.findById(expense.id)).not.toBeNull();
    expect(deps.queue.ops.map((op) => op.type)).toEqual(['RECEIPT_OCR']);
    expect(deps.scheduler.requests).toBe(1);
  });

  it('exige usuário autenticado', async () => {
    const { deps, capture } = setup();
    (deps.sessions as FakeSessionRepository).session = null;
    await expect(capture.execute({ kind: 'file', sourceUri: 'file:///a.jpg', mimeType: null })).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});

describe('RemoveExpenseItemUseCase', () => {
  async function withOcrExpense() {
    const env = setup();
    const created = await env.capture.execute({ kind: 'file', sourceUri: 'file:///tmp/p.jpg', mimeType: 'image/jpeg' });
    const expense = created.applyOcrResult(sampleOcr(), ctx('system:ocr', env.clock, env.ids));
    await env.deps.expenses.save(expense);
    return { ...env, expense };
  }

  it('recalcula, persiste e agenda o envio', async () => {
    const { deps, expense } = await withOcrExpense();
    const useCase = new RemoveExpenseItemUseCase(deps);

    const updated = await useCase.execute({ expenseId: expense.id, itemId: expense.items[2].id, reason: 'Bebida' });

    expect(updated.total.amount).toBe(6690);
    expect((await deps.expenses.findById(expense.id))?.total.amount).toBe(6690);
    expect(deps.queue.ops.some((op) => op.type === 'EXPENSE_UPSERT' && op.entityId === expense.id)).toBe(true);
  });

  it('impede alterar despesa de outro usuário', async () => {
    const { deps, expense } = await withOcrExpense();
    (deps.sessions as FakeSessionRepository).session = {
      user: { id: 'intruso', name: 'X', email: 'x@x.com', role: 'EMPLOYEE' },
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: '2099-01-01T00:00:00Z',
    };
    await expect(
      new RemoveExpenseItemUseCase(deps).execute({ expenseId: expense.id, itemId: expense.items[0].id }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('impede alterar despesa de relatório aprovado', async () => {
    const { deps, expense, clock, ids } = await withOcrExpense();
    const report = ExpenseReport.create(
      { ownerId: 'user-1', currency: 'BRL', title: 'Viagem', startDate: '2026-10-10', endDate: '2026-10-20' },
      ctx('user-1', clock, ids),
    )
      .submit(1, ctx('user-1', clock, ids))
      .applyDecision({ status: 'APPROVED', decidedAt: '2026-10-16T00:00:00Z', decidedBy: 'gestor', note: null }, ctx('x', clock, ids));
    await deps.reports.save(report);
    await deps.expenses.save(expense.attachToReport(report.id, ctx('user-1', clock, ids)));

    await expect(
      new RemoveExpenseItemUseCase(deps).execute({ expenseId: expense.id, itemId: expense.items[0].id }),
    ).rejects.toMatchObject({ code: 'LOCKED' });
  });
});

describe('DeleteExpenseUseCase', () => {
  it('remove a despesa, a foto e substitui operações pendentes por uma exclusão', async () => {
    const { deps, receipts, capture } = setup();
    const expense = await capture.execute({ kind: 'file', sourceUri: 'file:///tmp/p.jpg', mimeType: 'image/jpeg' });

    await new DeleteExpenseUseCase(deps, receipts).execute({ expenseId: expense.id });

    expect(await deps.expenses.findById(expense.id)).toBeNull();
    expect(receipts.removed).toEqual([expense.receipt!.localUri]);
    expect(deps.queue.ops.map((op) => op.type)).toEqual(['EXPENSE_DELETE']);
  });
});
