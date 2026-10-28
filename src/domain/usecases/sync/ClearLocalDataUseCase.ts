import { DomainError } from '@/core/errors';
import type { UseCase } from '@/core/UseCase';

import type { LocalDataStore } from '../../gateways/LocalDataStore';
import type { SyncQueue } from '../../repositories/SyncQueue';

export interface ClearLocalDataInput {
  /** Apagar mesmo com dados ainda não enviados (eles serão perdidos). */
  force?: boolean;
}

/**
 * Apaga o que está no aparelho (despesas, relatórios, fila de envio, preferências e fotos) sem
 * encerrar a sessão. A sincronização só envia: o que já subiu fica no servidor, mas não volta ao app.
 */
export class ClearLocalDataUseCase implements UseCase<ClearLocalDataInput, void> {
  constructor(
    private readonly queue: SyncQueue,
    private readonly localData: LocalDataStore,
  ) {}

  async execute(input: ClearLocalDataInput = {}): Promise<void> {
    const pending = await this.queue.countPending();
    if (pending > 0 && !input.force) {
      throw new DomainError('PENDING_SYNC', 'Existem dados ainda não enviados', { count: pending });
    }
    await this.localData.wipe();
  }
}
