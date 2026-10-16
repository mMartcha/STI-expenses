import type { Session } from '../entities/User';

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthGateway {
  signIn(credentials: Credentials): Promise<Session>;
  refresh(refreshToken: string): Promise<Session>;
  signOut(session: Session): Promise<void>;
}
