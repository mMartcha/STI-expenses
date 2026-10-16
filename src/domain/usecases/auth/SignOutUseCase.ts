import { DomainError } from '@/core/errors';
import type { Logger } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import type { AuthGateway } from '../../gateways/AuthGateway';
import type { LocalDataStore } from '../../gateways/LocalDataStore';
import type { SessionRepository } from '../../repositories/SessionRepository';
import type { SyncQueue } from '../../repositories/SyncQueue';

export interface SignOutInput {
  /** Sair mesmo com dados ainda não enviados (eles serão perdidos). */
  force?: boolean;
}

/**
 * Encerra a sessão e apaga os dados locais (banco e fotos), para que o próximo
 * usuário do aparelho não tenha acesso às despesas do anterior.
 */
export class SignOutUseCase implements UseCase<SignOutInput, void> {
  constructor(
    private readonly auth: AuthGateway,
    private readonly sessions: SessionRepository,
    private readonly queue: SyncQueue,
    private readonly localData: LocalDataStore,
    private readonly logger: Logger,
  ) {}

  async execute(input: SignOutInput = {}): Promise<void> {
    const pending = await this.queue.countPending();
    if (pending > 0 && !input.force) {
      throw new DomainError('PENDING_SYNC', 'Existem dados ainda não enviados', { count: pending });
    }

    const session = this.sessions.current();
    if (session) {
      // Revogar no servidor é "melhor esforço": sem internet, o token expira sozinho.
      await this.auth.signOut(session).catch((error) => this.logger.warn('Falha ao revogar sessão', { error }));
    }
    await this.localData.wipe();
    await this.sessions.clear();
  }
}
