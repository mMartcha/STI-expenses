import { DomainError, ValidationError } from '@/core/errors';
import { Expense } from '@/domain/entities/Expense';
import { ExpenseReport } from '@/domain/entities/ExpenseReport';
import { ReportSummaryCalculator } from '@/domain/services/ReportSummaryCalculator';

import { ctx } from '../helpers/fakes';

const trip = () =>
  ExpenseReport.create(
    { ownerId: 'user-1', currency: 'BRL', title: 'Viagem Não-Me-Toque', startDate: '2026-10-12', endDate: '2026-10-15', advance: 50000 },
    ctx(),
  );

function manual(amount: number, occurredAt: string, category: 'MEAL' | 'FUEL' = 'MEAL') {
  return Expense.createManual({ ownerId: 'user-1', description: 'x', amount, category, occurredAt, currency: 'BRL' }, ctx());
}

describe('ExpenseReport', () => {
  it('valida o período', () => {
    expect(() =>
      ExpenseReport.create({ ownerId: 'u', currency: 'BRL', title: 'X', startDate: '2026-10-15', endDate: '2026-10-10' }, ctx()),
    ).toThrow(ValidationError);
  });

  it('não envia relatório vazio', () => {
    expect(() => trip().submit(0, ctx())).toThrow(ValidationError);
  });

  it('continua editável após o envio e bloqueia após a aprovação', () => {
    const submitted = trip().submit(3, ctx());
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.isEditable).toBe(true);

    const edited = submitted.update(
      { title: 'Viagem corrigida', startDate: '2026-10-12', endDate: '2026-10-15', advance: 50000 },
      ctx(),
    );
    expect(edited.history.at(-1)?.changes).toEqual([{ field: 'title', from: 'Viagem Não-Me-Toque', to: 'Viagem corrigida' }]);

    const approved = edited.applyDecision({ status: 'APPROVED', decidedAt: '2026-10-16T10:00:00Z', decidedBy: 'gestor', note: null }, ctx());
    expect(approved.isEditable).toBe(false);
    expect(approved.history.at(-1)).toMatchObject({ action: 'REPORT_APPROVED', actorId: 'gestor' });
    expect(() => approved.update({ title: 'Y', startDate: '2026-10-12', endDate: '2026-10-15' }, ctx())).toThrow(DomainError);
  });

  it('consolida a viagem: total, dias, categorias e saldo do adiantamento', () => {
    const report = trip();
    const expenses = [
      manual(4500, '2026-10-12T15:00:00Z'),
      manual(30000, '2026-10-13T12:00:00Z', 'FUEL'),
      manual(5500, '2026-10-13T20:00:00Z'),
      manual(1000, '2026-10-20T12:00:00Z'), // fora do período
    ].map((expense) => expense.attachToReport(report.id, ctx()));

    const summary = new ReportSummaryCalculator().calculate(report, expenses);

    expect(summary.total.amount).toBe(41000);
    expect(summary.days.map((day) => day.total.amount)).toEqual([4500, 35500, 1000]);
    expect(summary.byCategory[0]).toMatchObject({ category: 'FUEL' });
    expect(summary.advanceBalance?.amount).toBe(50000 - 41000); // colaborador devolve R$ 90,00
    expect(summary.outOfPeriodIds).toHaveLength(1);
  });
});
