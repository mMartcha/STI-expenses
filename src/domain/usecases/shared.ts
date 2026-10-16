import { DomainError } from '@/core/errors';

import type { Session } from '../entities/User';
import type { SessionRepository } from '../repositories/SessionRepository';

/** Id usado no histórico quando a alteração é feita pelo sistema (ex.: leitura do OCR). */
export const SYSTEM_ACTOR = {
  ocr: 'system:ocr',
  sync: 'system:sync',
} as const;

export function requireSession(sessions: SessionRepository): Session {
  const session = sessions.current();
  if (!session) throw new DomainError('UNAUTHENTICATED', 'Usuário não autenticado');
  return session;
}

export function assertOwner(resource: { ownerId: string }, userId: string): void {
  if (resource.ownerId !== userId) {
    throw new DomainError('FORBIDDEN', 'Recurso pertence a outro usuário');
  }
}
