export type DomainErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'LOCKED'
  | 'INVALID_STATE'
  | 'UNAUTHENTICATED'
  | 'SIGN_IN_FAILED'
  | 'PENDING_SYNC';

/**
 * Erro de regra de negócio. `code` + `details` permitem à UI traduzir a mensagem
 * via i18n sem depender do texto (que é apenas para logs).
 */
export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly details: Record<string, string | number> = {},
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(readonly field: string, message: string, details: Record<string, string | number> = {}) {
    super('VALIDATION', message, { field, ...details });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} ${id} não encontrado(a)`, { entity });
    this.name = 'NotFoundError';
  }
}

/** Falha ao falar com o servidor. `retryable` decide se a fila de sync tenta de novo. */
export class RemoteError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'RemoteError';
  }
}

/** A operação depende de outra que ainda não foi sincronizada; tentar depois sem contar como falha. */
export class DependencyNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependencyNotReadyError';
  }
}
