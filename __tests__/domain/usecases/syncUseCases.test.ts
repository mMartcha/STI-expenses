import { RemoteError } from '@/core/errors';
import { Expense } from '@/domain/entities/Expense';
import { ExpenseReport } from '@/domain/entities/ExpenseReport';
import { RefreshReportDecisionsUseCase } from '@/domain/usecases/report/RefreshReportDecisionsUseCase';
import { SubmitReportUseCase } from '@/domain/usecases/report/SubmitReportUseCase';
import { computeBackoff, ProcessSyncQueueUseCase, SYNC_POLICY } from '@/domain/usecases/sync/ProcessSyncQueueUseCase';

import {
  ctx,
  FakeOcrGateway,
  FakeScheduler,
  FakeSessionRepository,
  FakeSyncGateway,
  FixedClock,
  InMemoryExpenseRepository,
  InMemoryReportRepository,
  InMemorySyncQueue,
  nullLogger,
  SequentialIds,
} from '../../helpers/fakes';

function setup() {
  const clock = new FixedClock();
  const ids = new SequentialIds();
  const expenses = new InMemoryExpenseRepository();
  const reports = new InMemoryReportRepository();
  const queue = new InMemorySyncQueue(clock);
  const ocr = new FakeOcrGateway();
  const remote = new FakeSyncGateway();
  const sessions = new FakeSessionRepository();
  const process = new ProcessSyncQueueUseCase(queue, expenses, reports, ocr, remote, clock, ids, nullLogger);
  return { clock, ids, expenses, reports, queue, ocr, remote, sessions, process };
}

async function pendingReceipt(env: ReturnType<typeof setup>) {
  const expense = Expense.createFromReceipt(
    { ownerId: 'user-1', receipt: { localUri: 'file:///r.jpg', mimeType: 'image/jpeg' }, currency: 'BRL' },
    ctx('user-1', env.clock, env.ids),
  );
  await env.expenses.save(expense);
  await env.queue.enqueue({ type: 'RECEIPT_OCR', entityId: expense.id });
  return expense;
}

describe('ProcessSyncQueueUseCase', () => {
  it('envia a foto, aplica o OCR e depois sincroniza a despesa', async () => {
    const env = setup();
    const expense = await pendingReceipt(env);

    await env.process.execute(); // OCR
    const afterOcr = await env.expenses.findById(expense.id);
    expect(afterOcr?.ocrStatus).toBe('DONE');
    expect(afterOcr?.receipt?.remoteId).toBe('remote-receipt-1');
    expect(afterOcr?.history.at(-1)).toMatchObject({ action: 'OCR_APPLIED', actorId: 'system:ocr' });

    await env.process.execute(); // EXPENSE_UPSERT gerado pelo OCR
    expect(env.remote.upserts).toHaveLength(1);
    expect((await env.expenses.findById(expense.id))?.syncStatus).toBe('SYNCED');
    expect(env.queue.ops).toHaveLength(0);
  });

  it('sem internet: reagenda com backoff e mantém tudo na fila', async () => {
    const env = setup();
    await pendingReceipt(env);
    env.ocr.uploadError = new RemoteError('Falha de conexão', true);

    const result = await env.process.execute();

    expect(result.failed).toBe(1);
    expect(env.queue.ops[0]).toMatchObject({ status: 'PENDING', attempts: 1 });
    expect(env.queue.ops[0].nextAttemptAt > env.clock.now().toISOString()).toBe(true);
    expect(await env.process.execute()).toEqual({ sent: 0, failed: 0, deferred: 0 }); // ainda não é hora
  });

  it('nota ilegível: marca OCR como falho (usuário preenche manualmente) sem travar a fila', async () => {
    const env = setup();
    const expense = await pendingReceipt(env);
    env.ocr.recognizeError = new RemoteError('ilegível', false, 422);

    await env.process.execute();

    expect((await env.expenses.findById(expense.id))?.ocrStatus).toBe('FAILED');
    expect(env.queue.ops.map((op) => op.type)).toEqual(['EXPENSE_UPSERT']);
  });

  it('erro permanente na API marca a operação como DEAD e a despesa como falha', async () => {
    const env = setup();
    const expense = Expense.createManual(
      { ownerId: 'user-1', description: 'Táxi', amount: 3000, category: 'TRANSPORT', occurredAt: '2026-10-15T10:00:00Z', currency: 'BRL' },
      ctx(),
    );
    await env.expenses.save(expense);
    await env.queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });
    env.remote.error = new RemoteError('HTTP 422', false, 422);

    await env.process.execute();

    expect(await env.queue.countDead()).toBe(1);
    expect((await env.expenses.findById(expense.id))?.syncStatus).toBe('FAILED');
  });

  it('não perde uma edição feita enquanto o envio anterior estava em andamento', async () => {
    const env = setup();
    const expense = Expense.createManual(
      { ownerId: 'user-1', description: 'Táxi', amount: 3000, category: 'TRANSPORT', occurredAt: '2026-10-15T10:00:00Z', currency: 'BRL' },
      ctx(),
    );
    await env.expenses.save(expense);
    await env.queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });

    env.remote.duringUpsert = async () => {
      env.remote.duringUpsert = null;
      const edited = expense.updateDetails({ notes: 'editado durante o envio' }, ctx());
      await env.expenses.save(edited);
      await env.queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: expense.id });
    };

    await env.process.execute();
    expect(await env.queue.countPending()).toBe(1); // a nova revisão continua na fila
    expect((await env.expenses.findById(expense.id))?.syncStatus).toBe('PENDING');

    await env.process.execute();
    expect(env.remote.upserts.at(-1)?.notes).toBe('editado durante o envio');
    expect((await env.expenses.findById(expense.id))?.syncStatus).toBe('SYNCED');
  });

  it('o envio do relatório aguarda as leituras de OCR pendentes', async () => {
    const env = setup();
    const report = ExpenseReport.create(
      { ownerId: 'user-1', currency: 'BRL', title: 'Viagem', startDate: '2026-10-12', endDate: '2026-10-15' },
      ctx('user-1', env.clock, env.ids),
    );
    await env.reports.save(report);
    const expense = await pendingReceipt(env);
    await env.expenses.save(expense.attachToReport(report.id, ctx('user-1', env.clock, env.ids)));

    await new SubmitReportUseCase({
      reports: env.reports,
      expenses: env.expenses,
      queue: env.queue,
      scheduler: new FakeScheduler(),
      sessions: env.sessions,
      clock: env.clock,
      ids: env.ids,
    }).execute({ reportId: report.id });

    env.ocr.uploadError = new RemoteError('offline', true);
    await env.process.execute();
    expect(env.remote.submitted).toHaveLength(0);
    expect(env.queue.ops.find((op) => op.type === 'REPORT_SUBMIT')?.attempts).toBe(0); // adiado, não falhou

    env.ocr.uploadError = null;
    env.clock.advance(SYNC_POLICY.maxDelayMs);
    for (let i = 0; i < 4; i += 1) await env.process.execute();
    expect(env.remote.submitted).toHaveLength(1);
    expect(env.remote.submitted[0].expenses[0].ocrStatus).toBe('DONE');
  });
});

describe('RefreshReportDecisionsUseCase', () => {
  it('ao aprovar, bloqueia o relatório e todas as despesas', async () => {
    const env = setup();
    const report = ExpenseReport.create(
      { ownerId: 'user-1', currency: 'BRL', title: 'Viagem', startDate: '2026-10-12', endDate: '2026-10-15' },
      ctx(),
    ).submit(1, ctx());
    await env.reports.save(report);
    const expense = Expense.createManual(
      { ownerId: 'user-1', description: 'Hotel', amount: 28900, category: 'LODGING', occurredAt: '2026-10-13T10:00:00Z', currency: 'BRL' },
      ctx(),
    ).attachToReport(report.id, ctx());
    await env.expenses.save(expense);
    env.remote.decisions = [{ reportId: report.id, status: 'APPROVED', decidedAt: '2026-10-16T09:00:00Z', decidedBy: 'gestor', note: null }];

    const changed = await new RefreshReportDecisionsUseCase(env.reports, env.expenses, env.remote, env.sessions, env.clock, env.ids).execute();

    expect(changed).toBe(1);
    expect((await env.reports.findById(report.id))?.status).toBe('APPROVED');
    expect((await env.expenses.findById(expense.id))?.locked).toBe(true);
  });
});

describe('computeBackoff', () => {
  it('cresce exponencialmente com teto', () => {
    const noJitter = () => 0.5;
    expect(computeBackoff(1, noJitter)).toBe(SYNC_POLICY.baseDelayMs);
    expect(computeBackoff(3, noJitter)).toBe(SYNC_POLICY.baseDelayMs * 4);
    expect(computeBackoff(50, noJitter)).toBe(SYNC_POLICY.maxDelayMs);
  });
});
