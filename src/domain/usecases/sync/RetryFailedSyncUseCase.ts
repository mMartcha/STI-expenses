import type { Clock } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { SyncScheduler } from '../../gateways/SyncScheduler';
import type { SyncQueue } from '../../repositories/SyncQueue';

/** "Tentar novamente": recoloca na fila o que falhou definitivamente. */
export class RetryFailedSyncUseCase implements UseCase<void, void> {
  constructor(
    private readonly queue: SyncQueue,
    private readonly scheduler: SyncScheduler,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<void> {
    await this.queue.reviveDead(this.clock.now());
    this.scheduler.request();
  }
}
