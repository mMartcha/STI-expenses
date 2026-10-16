import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import type { Logger } from '@/core/ports';
import type { Session } from '@/domain/entities/User';
import type { SessionRepository } from '@/domain/repositories/SessionRepository';

const KEY = 'stara.session.v1';
// Alguns iOS rejeitam valores acima de ~2 KB: dividimos em partes.
const CHUNK_SIZE = 1800;

const OPTIONS: SecureStore.SecureStoreOptions = {
  // Não migra para outro aparelho via backup e só fica acessível com o aparelho desbloqueado.
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const sessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    name: z.string(),
    email: z.string(),
    role: z.enum(['EMPLOYEE', 'MANAGER']),
  }),
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.string(),
});

/** Tokens no Keychain (iOS) / Keystore (Android) — nunca em AsyncStorage ou SQLite. */
export class SecureStoreSessionRepository implements SessionRepository {
  private cached: Session | null = null;

  constructor(private readonly logger: Logger) {}

  current(): Session | null {
    return this.cached;
  }

  async load(): Promise<Session | null> {
    try {
      const countRaw = await SecureStore.getItemAsync(`${KEY}.count`, OPTIONS);
      if (!countRaw) return (this.cached = null);

      const parts = await Promise.all(
        Array.from({ length: Number(countRaw) }, (_, index) => SecureStore.getItemAsync(`${KEY}.${index}`, OPTIONS)),
      );
      if (parts.some((part) => part === null)) throw new Error('Sessão corrompida');

      const parsed = sessionSchema.safeParse(JSON.parse(parts.join('')));
      if (!parsed.success) throw new Error('Formato de sessão inválido');
      return (this.cached = parsed.data);
    } catch (error) {
      this.logger.warn('Não foi possível ler a sessão salva; limpando', { error: String(error) });
      await this.clear();
      return null;
    }
  }

  async save(session: Session): Promise<void> {
    await this.clear();
    const raw = JSON.stringify(session);
    const chunks: string[] = [];
    for (let index = 0; index < raw.length; index += CHUNK_SIZE) chunks.push(raw.slice(index, index + CHUNK_SIZE));
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(`${KEY}.${index}`, chunk, OPTIONS)));
    await SecureStore.setItemAsync(`${KEY}.count`, String(chunks.length), OPTIONS);
    this.cached = session;
  }

  async clear(): Promise<void> {
    this.cached = null;
    const countRaw = await SecureStore.getItemAsync(`${KEY}.count`, OPTIONS).catch(() => null);
    const count = Number(countRaw ?? 0);
    await SecureStore.deleteItemAsync(`${KEY}.count`, OPTIONS).catch(() => undefined);
    await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.deleteItemAsync(`${KEY}.${index}`, OPTIONS).catch(() => undefined),
      ),
    );
  }
}
