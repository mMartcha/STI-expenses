import { CreateManualExpenseUseCase } from '@/domain/usecases/expense/CreateManualExpenseUseCase';
import { AttachExpensesToReportUseCase } from '@/domain/usecases/report/AttachExpensesToReportUseCase';
import { CreateReportUseCase } from '@/domain/usecases/report/CreateReportUseCase';
import type { ReportDeps } from '@/domain/usecases/report/ReportDeps';

import {
  FakeScheduler,
  FakeSessionRepository,
  FixedClock,
  InMemoryExpenseRepository,
  InMemoryReportRepository,
  InMemorySyncQueue,
  SequentialIds,
} from '../../helpers/fakes';

function setup() {
  const clock = new FixedClock();
  const ids = new SequentialIds();
  const deps: ReportDeps & { expenses: InMemoryExpenseRepository; reports: InMemoryReportRepository } = {
    expenses: new InMemoryExpenseRepository(),
    reports: new InMemoryReportRepository(),
    queue: new InMemorySyncQueue(clock),
    scheduler: new FakeScheduler(),
    sessions: new FakeSessionRepository(),
    clock,
    ids,
  };
  const createReport = new CreateReportUseCase(deps);
  const attach = new AttachExpensesToReportUseCase(deps);
  const createExpense = new CreateManualExpenseUseCase(deps.expenses, deps.reports, deps.queue, deps.scheduler, deps.sessions, clock, ids);
  const newExpense = (description: string) =>
    createExpense.execute({ description, amount: 1000, category: 'MEAL', occurredAt: '2026-10-26T12:00:00.000Z' });
  const newReport = (title: string) => createReport.execute({ title, startDate: '2026-10-26', endDate: '2026-10-29' });
  return { deps, attach, newExpense, newReport };
}

describe('AttachExpensesToReportUseCase', () => {
  it('não deixa a mesma despesa entrar em dois relatórios', async () => {
    const { deps, attach, newExpense, newReport } = setup();
    const expense = await newExpense('Almoço');
    const first = await newReport('Viagem A');
    const second = await newReport('Viagem B');

    await attach.execute({ reportId: first.id, expenseIds: [expense.id] });
    await expect(attach.execute({ reportId: second.id, expenseIds: [expense.id] })).rejects.toMatchObject({ code: 'INVALID_STATE' });

    expect((await deps.expenses.findById(expense.id))?.reportId).toBe(first.id);
  });

  it('não vincula nada do lote se uma das despesas já está em outro relatório', async () => {
    const { deps, attach, newExpense, newReport } = setup();
    const free = await newExpense('Táxi');
    const taken = await newExpense('Hotel');
    const first = await newReport('Viagem A');
    const second = await newReport('Viagem B');
    await attach.execute({ reportId: first.id, expenseIds: [taken.id] });

    await expect(attach.execute({ reportId: second.id, expenseIds: [free.id, taken.id] })).rejects.toMatchObject({ code: 'INVALID_STATE' });

    expect((await deps.expenses.findById(free.id))?.reportId).toBeNull();
    expect(await deps.expenses.listByReport(second.id)).toHaveLength(0);
  });
});
