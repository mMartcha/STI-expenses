export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
}

/** Quem está alterando, quando, e como gerar ids — necessário para o histórico de auditoria. */
export interface ChangeContext {
  actorId: string;
  now: Date;
  newId: () => string;
}

export function createChangeContext(actorId: string, clock: Clock, ids: IdGenerator): ChangeContext {
  return { actorId, now: clock.now(), newId: () => ids.next() };
}
