import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import { requireSession } from '../shared';

export interface ListExpensesInput {
  from?: string;
  to?: string;
  unassignedOnly?: boolean;
}

/** Lista as despesas do usuário (rotina do dia, da semana ou avulsas). */
export class ListExpensesUseCase implements UseCase<ListExpensesInput, Expense[]> {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async execute(input: ListExpensesInput = {}): Promise<Expense[]> {
    const session = requireSession(this.sessions);
    return this.expenses.list({ ownerId: session.user.id, ...input });
  }
}
