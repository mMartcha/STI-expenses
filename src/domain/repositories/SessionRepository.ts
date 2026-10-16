import type { Session } from '../entities/User';

/** Armazena a sessão em local seguro (Keychain / Keystore). */
export interface SessionRepository {
  load(): Promise<Session | null>;
  /** Sessão em memória (sem I/O); `null` se não houver usuário autenticado. */
  current(): Session | null;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
}
