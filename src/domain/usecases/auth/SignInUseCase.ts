import { DomainError } from '@/core/errors';
import type { UseCase } from '@/core/UseCase';

import type { User } from '../../entities/User';
import type { AuthBrowser } from '../../gateways/AuthBrowser';
import type { AuthGateway } from '../../gateways/AuthGateway';
import type { SessionRepository } from '../../repositories/SessionRepository';

export interface SignInInput {
  /** Chamado quando o usuário volta do navegador e o app passa a validar o acesso. */
  onValidating?: () => void;
}

/**
 * Login corporativo (Entra ID): busca a URL de login no backend, abre o navegador,
 * recebe o callback e troca o `code` pelo JWT do sistema. O `state` é validado pelo backend.
 * Devolve `null` quando o usuário fecha o navegador sem entrar.
 */
export class SignInUseCase implements UseCase<SignInInput, User | null> {
  constructor(
    private readonly auth: AuthGateway,
    private readonly browser: AuthBrowser,
    private readonly sessions: SessionRepository,
  ) {}

  async execute(input: SignInInput = {}): Promise<User | null> {
    const url = await this.auth.getAuthorizationUrl();
    const result = await this.browser.open(url);
    if (result.type === 'cancel') return null;

    const { code, state, error } = result.params;
    if (error) throw new DomainError('SIGN_IN_FAILED', `Provedor recusou o login: ${error}`);
    if (!code || !state) throw new DomainError('SIGN_IN_FAILED', 'Callback sem code/state');

    input.onValidating?.();
    const session = await this.auth.completeSignIn({ code, state });
    await this.sessions.save(session);
    return session.user;
  }
}
