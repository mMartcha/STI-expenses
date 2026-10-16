import { RemoteError } from '@/core/errors';
import type { Clock, Logger } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';

import { isSessionExpired, type User } from '../../entities/User';
import type { AuthGateway } from '../../gateways/AuthGateway';
import type { SessionRepository } from '../../repositories/SessionRepository';

/**
 * Restaura a sessão salva ao abrir o app. Sem internet, mantém o usuário logado
 * (o app é offline-first); o token é renovado quando a conexão voltar.
 */
export class RestoreSessionUseCase implements UseCase<void, User | null> {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly auth: AuthGateway,
    private readonly clock: Clock,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<User | null> {
    const session = await this.sessions.load();
    if (!session) return null;
    if (!isSessionExpired(session, this.clock.now())) return session.user;

    try {
      const renewed = await this.auth.refresh(session.refreshToken);
      await this.sessions.save(renewed);
      return renewed.user;
    } catch (error) {
      if (error instanceof RemoteError && error.retryable) {
        this.logger.warn('Sem conexão para renovar a sessão; seguindo offline');
        return session.user;
      }
      this.logger.info('Sessão expirada; é preciso entrar novamente');
      await this.sessions.clear();
      return null;
    }
  }
}
