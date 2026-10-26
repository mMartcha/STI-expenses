import type { Session } from '../entities/User';

/** O que o provedor de identidade (Entra ID) devolve no callback após o login. */
export interface AuthorizationCallback {
  code: string;
  state: string;
}

/**
 * Login corporativo em duas etapas, intermediado pelo backend:
 * 1. `getAuthorizationUrl` (GET): o backend monta a URL de login do Entra ID.
 * 2. `completeSignIn` (POST): o backend troca o `code` do callback pelo JWT do sistema.
 */
export interface AuthGateway {
  getAuthorizationUrl(): Promise<string>;
  completeSignIn(callback: AuthorizationCallback): Promise<Session>;
  refresh(refreshToken: string): Promise<Session>;
  signOut(session: Session): Promise<void>;
}
