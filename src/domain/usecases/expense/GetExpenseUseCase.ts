import { NotFoundError } from '@/core/errors';
import type { UseCase } from '@/core/UseCase';

import type { Expense } from '../../entities/Expense';
import type { ExpenseRepository } from '../../repositories/ExpenseRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import { assertOwner, requireSession } from '../shared';

export class GetExpenseUseCase implements UseCase<{ expenseId: string }, Expense> {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async execute({ expenseId }: { expenseId: string }): Promise<Expense> {
    const session = requireSession(this.sessions);
    const expense = await this.expenses.findById(expenseId);
    if (!expense) throw new NotFoundError('Expense', expenseId);
    assertOwner(expense, session.user.id);
    return expense;
  }
}
