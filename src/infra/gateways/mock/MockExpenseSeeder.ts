import type { Clock } from '@/core/ports';
import type { ExpenseCategory, PaymentMethod } from '@/domain/entities/ExpenseCategory';
import type { ExpenseRepository } from '@/domain/repositories/ExpenseRepository';
import type { SessionRepository } from '@/domain/repositories/SessionRepository';
import { addDays, toDateKey } from '@/domain/shared/dates';
import type { CreateManualExpenseUseCase } from '@/domain/usecases/expense/CreateManualExpenseUseCase';
import type { AttachExpensesToReportUseCase } from '@/domain/usecases/report/AttachExpensesToReportUseCase';
import type { CreateReportUseCase } from '@/domain/usecases/report/CreateReportUseCase';

interface SeedExpense {
  /** Dias atrás (0 = hoje). */
  daysAgo: number;
  /** Hora local (HH:MM). Hoje, nunca passa do horário atual. */
  time: string;
  description: string;
  merchant: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  /** Em centavos. */
  amount: number;
  /** Já entra no relatório de exemplo (para testar o bloqueio "já está em outro relatório"). */
  inSampleReport?: boolean;
}

const SEED: readonly SeedExpense[] = [
  // Hoje
  { daysAgo: 0, time: '07:40', description: 'Café da manhã', merchant: 'Padaria Central', category: 'MEAL', paymentMethod: 'CORPORATE_CARD', amount: 2890 },
  { daysAgo: 0, time: '08:15', description: 'Abastecimento', merchant: 'Posto Ipiranga BR-285', category: 'FUEL', paymentMethod: 'CORPORATE_CARD', amount: 28750 },
  { daysAgo: 0, time: '09:30', description: 'Pedágio Carazinho', merchant: 'Rodovia das Colinas', category: 'TOLL', paymentMethod: 'CASH', amount: 1260 },
  { daysAgo: 0, time: '12:20', description: 'Almoço com cliente', merchant: 'Churrascaria Gaúcha', category: 'MEAL', paymentMethod: 'CORPORATE_CARD', amount: 18490 },
  { daysAgo: 0, time: '14:05', description: 'Estacionamento', merchant: 'Estapar Centro', category: 'PARKING', paymentMethod: 'PIX', amount: 1800 },
  // Ontem
  { daysAgo: 1, time: '08:00', description: 'Uber até o aeroporto', merchant: 'Uber', category: 'TRANSPORT', paymentMethod: 'CREDIT_CARD', amount: 6340 },
  { daysAgo: 1, time: '12:45', description: 'Almoço', merchant: 'Restaurante Sabor do Sul', category: 'MEAL', paymentMethod: 'CORPORATE_CARD', amount: 5690 },
  { daysAgo: 1, time: '20:10', description: 'Hospedagem', merchant: 'Hotel Ibis Passo Fundo', category: 'LODGING', paymentMethod: 'CORPORATE_CARD', amount: 31900 },
  // 2 dias atrás
  { daysAgo: 2, time: '09:10', description: 'Material para demonstração', merchant: 'Kalunga', category: 'SUPPLIES', paymentMethod: 'DEBIT_CARD', amount: 8935 },
  { daysAgo: 2, time: '19:30', description: 'Jantar', merchant: 'Cantina Italiana', category: 'MEAL', paymentMethod: 'CORPORATE_CARD', amount: 7420 },
  // 3 e 4 dias atrás: já no relatório de exemplo
  { daysAgo: 3, time: '07:50', description: 'Abastecimento', merchant: 'Posto Shell Cruz Alta', category: 'FUEL', paymentMethod: 'CORPORATE_CARD', amount: 31220, inSampleReport: true },
  { daysAgo: 3, time: '12:30', description: 'Almoço', merchant: 'Buffet da Praça', category: 'MEAL', paymentMethod: 'CORPORATE_CARD', amount: 4650, inSampleReport: true },
  { daysAgo: 4, time: '21:00', description: 'Hospedagem', merchant: 'Hotel Cruz Alta', category: 'LODGING', paymentMethod: 'CORPORATE_CARD', amount: 27800, inSampleReport: true },
  { daysAgo: 4, time: '15:40', description: 'Pedágio', merchant: 'EGR', category: 'TOLL', paymentMethod: 'CASH', amount: 980 },
  // 5 a 7 dias atrás
  { daysAgo: 5, time: '12:10', description: 'Almoço', merchant: 'Restaurante Tchê', category: 'MEAL', paymentMethod: 'CORPORATE_CARD', amount: 5230 },
  { daysAgo: 5, time: '17:25', description: 'Táxi', merchant: 'Rádio Táxi Ijuí', category: 'TRANSPORT', paymentMethod: 'CASH', amount: 3500 },
  { daysAgo: 6, time: '08:30', description: 'Abastecimento', merchant: 'Posto Petrobras Ijuí', category: 'FUEL', paymentMethod: 'CORPORATE_CARD', amount: 26510 },
  { daysAgo: 6, time: '13:00', description: 'Almoço', merchant: 'Galeto do Zé', category: 'MEAL', paymentMethod: 'CORPORATE_CARD', amount: 4980 },
  { daysAgo: 7, time: '10:15', description: 'Cópias e impressões', merchant: 'Copiadora Express', category: 'OTHER', paymentMethod: 'PIX', amount: 2340 },
  { daysAgo: 7, time: '19:45', description: 'Jantar', merchant: 'Pizzaria Bella', category: 'MEAL', paymentMethod: 'CREDIT_CARD', amount: 6890 },
];

/**
 * Só no modo mock: preenche o banco local com despesas de hoje e da última semana (e um relatório
 * com algumas delas) para testar o fluxo de montar relatórios. Roda apenas com o banco vazio.
 */
export class MockExpenseSeeder {
  private running: Promise<boolean> | null = null;

  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
    private readonly createExpense: CreateManualExpenseUseCase,
    private readonly createReport: CreateReportUseCase,
    private readonly attach: AttachExpensesToReportUseCase,
  ) {}

  /** Devolve `true` se criou dados (a UI pode revalidar as telas). */
  seedIfEmpty(): Promise<boolean> {
    this.running ??= this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async run(): Promise<boolean> {
    const session = this.sessions.current();
    if (!session) return false;
    const existing = await this.expenses.list({ ownerId: session.user.id });
    if (existing.length > 0) return false;

    const now = this.clock.now();
    const today = toDateKey(now);
    const sampleIds: string[] = [];

    for (const seed of SEED) {
      const expense = await this.createExpense.execute({
        description: seed.description,
        merchantName: seed.merchant,
        amount: seed.amount,
        category: seed.category,
        paymentMethod: seed.paymentMethod,
        occurredAt: occurredAt(addDays(today, -seed.daysAgo), seed.time, now),
      });
      if (seed.inSampleReport) sampleIds.push(expense.id);
    }

    const report = await this.createReport.execute({
      title: 'Visita técnica Cruz Alta',
      purpose: 'Demonstração de plantadeira para revenda',
      startDate: addDays(today, -4),
      endDate: addDays(today, -3),
    });
    await this.attach.execute({ reportId: report.id, expenseIds: sampleIds });
    return true;
  }
}

/** Instante local do dia/hora pedidos; se for hoje, nunca no futuro. */
function occurredAt(dateKey: string, time: string, now: Date): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const at = new Date(y, m - 1, d, hh, mm);
  if (at <= now) return at.toISOString();
  // Hoje, depois do horário atual: puxa para alguns minutos antes de agora, sem sair do dia.
  const startOfDay = new Date(y, m - 1, d).getTime();
  return new Date(Math.max(startOfDay, now.getTime() - (24 * 60 - hh * 60 - mm) * 1000)).toISOString();
}
