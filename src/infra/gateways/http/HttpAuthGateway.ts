import { DomainError, RemoteError } from '@/core/errors';
import type { Session } from '@/domain/entities/User';
import type { AuthGateway, Credentials } from '@/domain/gateways/AuthGateway';

import type { HttpClient } from '../../http/HttpClient';
import { sessionDto } from '../../http/dto';

/** TODO: alinhar endpoints com o provedor de identidade (ex.: OAuth2 + PKCE como no app da IA). */
export class HttpAuthGateway implements AuthGateway {
  constructor(private readonly http: HttpClient) {}

  async signIn(credentials: Credentials): Promise<Session> {
    try {
      return await this.http.request('/auth/login', {
        method: 'POST',
        body: credentials,
        schema: sessionDto,
        authenticated: false,
      });
    } catch (error) {
      if (error instanceof RemoteError && (error.status === 401 || error.status === 400)) {
        throw new DomainError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos');
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
