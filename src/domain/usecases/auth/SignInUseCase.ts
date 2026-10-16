import { ValidationError } from '@/core/errors';
import type { UseCase } from '@/core/UseCase';

import type { User } from '../../entities/User';
import type { AuthGateway, Credentials } from '../../gateways/AuthGateway';
import type { SessionRepository } from '../../repositories/SessionRepository';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SignInUseCase implements UseCase<Credentials, User> {
  constructor(
    private readonly auth: AuthGateway,
    private readonly sessions: SessionRepository,
  ) {}

  async execute(input: Credentials): Promise<User> {
    const email = input.email.trim().toLowerCase();
    if (!EMAIL.test(email)) throw new ValidationError('email', 'E-mail inválido');
    if (!input.password) throw new ValidationError('password', 'Senha obrigatória');

    const session = await this.auth.signIn({ email, password: input.password });
    await this.sessions.save(session);
    return session.user;
  }
}
