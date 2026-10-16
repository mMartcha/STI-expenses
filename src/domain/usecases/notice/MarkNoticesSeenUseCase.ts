import type { Clock } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { PreferencesRepository } from '../../repositories/PreferencesRepository';
import type { SessionRepository } from '../../repositories/SessionRepository';
import { requireSession } from '../shared';
import { noticesSeenKey } from './ListNoticesUseCase';

/** Marca os avisos como vistos (apaga o ponto do sino para eventos já lidos). */
export class MarkNoticesSeenUseCase implements UseCase<void, void> {
  constructor(
    private readonly preferences: PreferencesRepository,
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<void> {
    const session = requireSession(this.sessions);
    await this.preferences.set(noticesSeenKey(session.user.id), this.clock.now().toISOString());
  }
}
