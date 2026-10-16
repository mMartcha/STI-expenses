import { randomUUID } from 'expo-crypto';

import type { Clock, IdGenerator, Logger } from '@/core/ports';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** UUID v4 criptograficamente seguro — ids gerados no aparelho funcionam offline sem colisão. */
export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}

const SENSITIVE_KEYS = /token|password|authorization|secret/i;

function redact(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return meta;
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [key, SENSITIVE_KEYS.test(key) ? '[redacted]' : value]));
}

/**
 * Logger padrão: em desenvolvimento escreve no console; em produção só registra
 * avisos e erros (ponto de integração para Sentry/Datadog, por exemplo).
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly verbose: boolean) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.verbose) console.debug(`[debug] ${message}`, redact(meta) ?? '');
  }
  info(message: string, meta?: Record<string, unknown>): void {
    if (this.verbose) console.info(`[info] ${message}`, redact(meta) ?? '');
  }
  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.verbose) console.warn(`[warn] ${message}`, redact(meta) ?? '');
  }
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    // TODO: enviar para o serviço de monitoramento quando definido.
    if (this.verbose) console.error(`[error] ${message}`, error, redact(meta) ?? '');
  }
}
