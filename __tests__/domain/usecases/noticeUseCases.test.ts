import { Expense } from '@/domain/entities/Expense';
import { ExpenseReport } from '@/domain/entities/ExpenseReport';
import type { PreferencesRepository } from '@/domain/repositories/PreferencesRepository';
import { CaptureReceiptUseCase } from '@/domain/usecases/expense/CaptureReceiptUseCase';
import { ListNoticesUseCase } from '@/domain/usecases/notice/ListNoticesUseCase';
import { MarkNoticesSeenUseCase } from '@/domain/usecases/notice/MarkNoticesSeenUseCase';

import {
  ctx,
  FakeReceiptStorage,
  FakeScheduler,
  FakeSessionRepository,
  FixedClock,
  InMemoryExpenseRepository,
  InMemoryReportRepository,
  InMemorySyncQueue,
  SequentialIds,
} from '../../helpers/fakes';

class MemoryPreferences implements PreferencesRepository {
  private readonly values = new Map<string, string>();
  async get(key: string) {
    return this.values.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.values.set(key, value);
  }
}

function setup() {
  const clock = new FixedClock();
  const ids = new SequentialIds();
  const reports = new InMemoryReportRepository();
  const expenses = new InMemoryExpenseRepository();
  const queue = new InMemorySyncQueue(clock);
  const preferences = new MemoryPreferences();
  const sessions = new FakeSessionRepository();
  return {
    clock,
    ids,
    reports,
    expenses,
    queue,
    list: new ListNoticesUseCase(reports, expenses, queue, preferences, sessions, clock),
    markSeen: new MarkNoticesSeenUseCase(preferences, sessions, clock),
  };
}

async function approvedReport(env: ReturnType<typeof setup>) {
  const report = ExpenseReport.create(
    { ownerId: 'user-1', currency: 'BRL', title: 'Viagem Passo Fundo', startDate: '2026-10-12', endDate: '2026-10-14' },
    ctx('user-1', env.clock, env.ids),
  )
    .submit(1, ctx('user-1', env.clock, env.ids))
    .applyDecision({ status: 'APPROVED', decidedAt: '2026-10-15T09:00:00.000Z', decidedBy: 'gestor', note: null }, ctx('x', env.clock, env.ids));
  await env.reports.save(report);
  return report;
}

describe('ListNoticesUseCase', () => {
  it('mostra o ponto no sino para aprovação nova e apaga depois de visto', async () => {
    const env = setup();
    await approvedReport(env);

    const before = await env.list.execute();
    expect(before.notices[0]).toMatchObject({ type: 'REPORT_APPROVED', targetLabel: 'Viagem Passo Fundo', unread: true });
    expect(before.hasAttention).toBe(true);

    await env.markSeen.execute();
    const after = await env.list.execute();
    expect(after.notices[0].unread).toBe(false);
    expect(after.hasAttention).toBe(false);
  });

  it('pendências (OCR falhou sem preenchimento, envio falhou) continuam sinalizadas mesmo após vistas', async () => {
    const env = setup();
    const failed = Expense.createFromReceipt(
      { ownerId: 'user-1', receipt: { localUri: 'file:///r.jpg', mimeType: 'image/jpeg' }, currency: 'BRL' },
      ctx('user-1', env.clock, env.ids),
    ).markOcrFailed('ilegível', ctx('system:ocr', env.clock, env.ids));
    await env.expenses.save(failed);
    await env.queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: 'x' });
    await env.queue.reschedule(env.queue.ops[0].id, { attempts: 8, nextAttemptAt: '2099-01-01', lastError: 'x', dead: true });

    await env.markSeen.execute();
    const feed = await env.list.execute();

    expect(feed.notices.map((notice) => notice.type).sort()).toEqual(['OCR_FAILED', 'SYNC_FAILED']);
    expect(feed.hasAttention).toBe(true);
  });
});

describe('CaptureReceiptUseCase (colar da área de transferência)', () => {
  it('grava o conteúdo base64 e cria a despesa aguardando OCR', async () => {
    const clock = new FixedClock();
    const ids = new SequentialIds();
    const expenses = new InMemoryExpenseRepository();
    const queue = new InMemorySyncQueue(clock);
    const useCase = new CaptureReceiptUseCase(
      expenses,
      new FakeReceiptStorage(),
      queue,
      new FakeScheduler(),
      new FakeSessionRepository(),
      clock,
      ids,
    );

    const expense = await useCase.execute({ kind: 'base64', data: 'data:image/jpeg;base64,AAAA', mimeType: 'image/jpeg' });

    expect(expense.receipt).toMatchObject({ localUri: 'file:///receipts/pasted.png', mimeType: 'image/jpeg' });
    expect(expense.ocrStatus).toBe('PENDING');
    expect(queue.ops.map((op) => op.type)).toEqual(['RECEIPT_OCR']);
  });
});
