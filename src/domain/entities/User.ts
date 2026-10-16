export type UserRole = 'EMPLOYEE' | 'MANAGER';

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  /** Perfil de gestor já previsto; as telas de aprovação devem ficar no app web. */
  readonly role: UserRole;
}

export interface Session {
  readonly user: User;
  readonly accessToken: string;
  readonly refreshToken: string;
  /** ISO 8601 */
  readonly expiresAt: string;
}

export function isSessionExpired(session: Session, now: Date, skewMs = 30_000): boolean {
  return new Date(session.expiresAt).getTime() - skewMs <= now.getTime();
}
