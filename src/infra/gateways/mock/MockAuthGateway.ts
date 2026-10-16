import { DomainError } from '@/core/errors';
import type { IdGenerator } from '@/core/ports';
import type { Session } from '@/domain/entities/User';
import type { AuthGateway, Credentials } from '@/domain/gateways/AuthGateway';

import { latency } from './delay';

const SESSION_TTL_MS = 60 * 60_000;

/**
 * Autenticação simulada: qualquer e-mail válido com senha de 6+ caracteres entra.
 * O id do usuário é derivado do e-mail, então o mesmo login vê os mesmos dados.
 */
export class MockAuthGateway implements AuthGateway {
  constructor(private readonly ids: IdGenerator) {}

  async signIn({ email, password }: Credentials): Promise<Session> {
    await latency(500, 900);
    if (password.length < 6) throw new DomainError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos');

    const name = email
      .split('@')[0]
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return this.issue({ id: `mock-${email}`, name, email, role: 'EMPLOYEE' });
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
