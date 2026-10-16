import type { z } from 'zod';

import { RemoteError } from '@/core/errors';
import type { Logger } from '@/core/ports';

export interface TokenProvider {
  getAccessToken(): string | null;
  /** Renova a sessão; retorna o novo token ou `null` se não for possível (deslogar). */
  refreshAccessToken(): Promise<string | null>;
}

export interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Schema Zod da resposta: nada vindo do servidor vira objeto sem validação. */
  schema?: z.ZodType<T>;
  idempotencyKey?: string;
  timeoutMs?: number;
  authenticated?: boolean;
  headers?: Record<string, string>;
}

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Cliente HTTP único: timeout, token, renovação de sessão em 401 (uma única renovação
 * concorrente), chave de idempotência e classificação de erro (retentável ou não).
 */
export class HttpClient {
  private refreshing: Promise<string | null> | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly tokens: TokenProvider,
    private readonly logger: Logger,
    private readonly appVersion: string,
  ) {
    if (!baseUrl.startsWith('https://')) throw new Error('A API deve usar HTTPS');
  }

  async request<T = void>(path: string, options: RequestOptions<T> = {}): Promise<T> {
    const response = await this.send(path, options, false);
    if (response.status === 204 || !options.schema) return undefined as T;

    const json: unknown = await response.json().catch(() => {
      throw new RemoteError('Resposta inválida do servidor', true, response.status);
    });
    const parsed = options.schema.safeParse(json);
    if (!parsed.success) {
      this.logger.error('Contrato da API violado', parsed.error, { path });
      throw new RemoteError('Resposta inesperada do servidor', false, response.status);
    }
    return parsed.data;
  }

  /** Upload multipart (ex.: foto da nota). */
  async upload<T>(path: string, form: FormData, options: Omit<RequestOptions<T>, 'body' | 'method'> = {}): Promise<T> {
    return this.request(path, { ...options, method: 'POST', body: form, timeoutMs: options.timeoutMs ?? 60_000 });
  }

  private async send<T>(path: string, options: RequestOptions<T>, isRetry: boolean): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-App-Version': this.appVersion,
      ...options.headers,
    };
    if (!isForm && options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    if (options.authenticated !== false) {
      const token = this.tokens.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: isForm ? (options.body as FormData) : options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      throw new RemoteError(aborted ? 'Tempo de resposta esgotado' : 'Falha de conexão', true);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 401 && options.authenticated !== false && !isRetry) {
      const token = await this.refreshOnce();
      if (token) return this.send(path, options, true);
    }

    if (!response.ok) {
      const retryable = response.status >= 500 || response.status === 408 || response.status === 429;
      throw new RemoteError(`HTTP ${response.status}`, retryable, response.status);
    }
    return response;
  }

  private refreshOnce(): Promise<string | null> {
    this.refreshing ??= this.tokens.refreshAccessToken().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }
}
