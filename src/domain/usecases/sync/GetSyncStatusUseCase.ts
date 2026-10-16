import type { UseCase } from '@/core/UseCase';

import type { SyncQueue } from '../../repositories/SyncQueue';

export interface SyncStatus {
  /** Operações aguardando envio. */
  pending: number;
  /** Operações que falharam definitivamente e precisam de nova tentativa manual. */
  failed: number;
}

export class GetSyncStatusUseCase implements UseCase<void, SyncStatus> {
  constructor(private readonly queue: SyncQueue) {}

  async execute(): Promise<SyncStatus> {
    const [pending, failed] = await Promise.all([this.queue.countPending(), this.queue.countDead()]);
    return { pending, failed };
  }
}
