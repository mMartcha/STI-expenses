import { DomainError, RemoteError } from '@/core/errors';
import type { Session } from '@/domain/entities/User';
import type { AuthGateway, AuthorizationCallback } from '@/domain/gateways/AuthGateway';

import type { HttpClient } from '../../http/HttpClient';
import { authorizationUrlDto, sessionDto } from '../../http/dto';

/**
 * Login via Entra ID intermediado pelo backend.
 * TODO: confirmar com o backend os caminhos, o corpo do POST e o redirect_uri cadastrado
 * no App Registration (sugestão: `ocrstara://auth/callback` + PKCE no backend).
 */
export class HttpAuthGateway implements AuthGateway {
  constructor(private readonly http: HttpClient) {}

  async getAuthorizationUrl(): Promise<string> {
    const { url } = await this.http.request('/api/v1/login', { schema: authorizationUrlDto, authenticated: false });
    return url;
  }

  async completeSignIn(callback: AuthorizationCallback): Promise<Session> {
    try {
      return await this.http.request('/api/v1/login/callback', {
        method: 'POST',
        body: callback,
        schema: sessionDto,
        authenticated: false,
      });
    } catch (error) {
      if (error instanceof RemoteError && error.status !== undefined && [400, 401, 403].includes(error.status)) {
        throw new DomainError('SIGN_IN_FAILED', 'Backend recusou o callback do login');
      }
      throw error;
    }
  }

  refresh(refreshToken: string): Promise<Session> {
    return this.http.request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      schema: sessionDto,
      authenticated: false,
    });
  }

  async signOut(session: Session): Promise<void> {
    await this.http.request('/auth/logout', { method: 'POST', body: { refreshToken: session.refreshToken } });
  }
}
