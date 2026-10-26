import { DomainError } from '@/core/errors';
import type { IdGenerator } from '@/core/ports';
import type { Session } from '@/domain/entities/User';
import type { AuthBrowser, AuthBrowserResult } from '@/domain/gateways/AuthBrowser';
import type { AuthGateway, AuthorizationCallback } from '@/domain/gateways/AuthGateway';

import { latency } from './delay';

const SESSION_TTL_MS = 60 * 60_000;
const MOCK_CODE = 'mock-code';
const MOCK_STATE = 'mock-state';
const DEMO_USER: Session['user'] = { id: 'mock-demo', name: 'Usuário Demonstração', email: 'demo@stara.com.br', role: 'EMPLOYEE' };

/** Autenticação simulada: o "login" sempre entra com o usuário de demonstração. */
export class MockAuthGateway implements AuthGateway {
  constructor(private readonly ids: IdGenerator) {}

  async getAuthorizationUrl(): Promise<string> {
    await latency(200, 400);
    return `https://login.microsoftonline.com/mock/oauth2/v2.0/authorize?state=${MOCK_STATE}`;
  }

  async completeSignIn({ code, state }: AuthorizationCallback): Promise<Session> {
    await latency(500, 900);
    if (code !== MOCK_CODE || state !== MOCK_STATE) throw new DomainError('SIGN_IN_FAILED', 'Callback simulado inválido');
    return this.issue(DEMO_USER);
  }

  async refresh(refreshToken: string): Promise<Session> {
    await latency();
    const encoded = refreshToken.slice(refreshToken.indexOf('.') + 1);
    const user = JSON.parse(decodeURIComponent(encoded)) as Session['user'];
    return this.issue(user);
  }

  async signOut(): Promise<void> {
    await latency(100, 200);
  }

  private issue(user: Session['user']): Session {
    return {
      user,
      accessToken: `mock-access.${this.ids.next()}`,
      refreshToken: `mock-refresh.${encodeURIComponent(JSON.stringify(user))}`,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
  }
}

/** Navegador simulado: não abre nada e responde como se o usuário tivesse entrado. */
export class MockAuthBrowser implements AuthBrowser {
  async open(): Promise<AuthBrowserResult> {
    await latency(300, 600);
    return { type: 'success', params: { code: MOCK_CODE, state: MOCK_STATE } };
  }
}
