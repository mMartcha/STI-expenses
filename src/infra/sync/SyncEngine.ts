import { AppState, type AppStateStatus } from 'react-native';

import type { Logger } from '@/core/ports';
import type { UseCase } from '@/core/UseCase';
import type { SyncScheduler } from '@/domain/gateways/SyncScheduler';
import { SYNC_POLICY, type SyncRunResult } from '@/domain/usecases/sync/ProcessSyncQueueUseCase';

import type { ExpoNetworkMonitor } from '../network/ExpoNetworkMonitor';

const DEBOUNCE_MS = 300;
const PERIODIC_MS = 60_000;
const MAX_LOOPS = 10;

/**
 * Orquestra quando sincronizar: logo após cada alteração (com internet), quando a
 * conexão volta, quando o app volta ao primeiro plano e periodicamente (para as
 * retentativas com backoff). Garante uma única execução por vez (single-flight).
 */
export class SyncEngine implements SyncScheduler {
  private running = false;
  private rerunRequested = false;
  private debounce: ReturnType<typeof setTimeout> | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly processQueue: UseCase<void, SyncRunResult>,
    private readonly refreshDecisions: UseCase<void, number>,
    private readonly network: ExpoNetworkMonitor,
    private readonly logger: Logger,
  ) {}

  request(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      this.debounce = null;
      void this.run();
    }, DEBOUNCE_MS);
  }

  /** Inicia os gatilhos automáticos. Retorna a função para pará-los. */
  start(): () => void {
    const unsubscribeNetwork = this.network.subscribe((online) => {
      if (online) this.request();
    });
    const appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') this.request();
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') this.request();
    }, PERIODIC_MS);

    this.request();
    return () => {
      unsubscribeNetwork();
      appStateSubscription.remove();
      clearInterval(interval);
      if (this.debounce) clearTimeout(this.debounce);
    };
  }

  /** Avisado ao fim de cada rodada (a UI usa para atualizar as telas). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async run(): Promise<void> {
    if (this.running) {
      this.rerunRequested = true;
      return;
    }
    this.running = true;
    let changed = false;

    try {
      if (!(await this.network.isOnline())) return;

      let loops = 0;
      do {
        this.rerunRequested = false;
        const result = await this.processQueue.execute();
        changed ||= result.sent + result.failed > 0;
        const processed = result.sent + result.failed + result.deferred;
        if (processed < SYNC_POLICY.batchSize && !this.rerunRequested) break;
      } while (++loops < MAX_LOOPS);

      const decisions = await this.refreshDecisions.execute().catch((error) => {
        this.logger.warn('Falha ao consultar aprovações', { error: String(error) });
        return 0;
      });
      changed ||= decisions > 0;
    } catch (error) {
      this.logger.error('Erro inesperado na sincronização', error);
    } finally {
      this.running = false;
      if (changed) this.listeners.forEach((listener) => listener());
      if (this.rerunRequested) this.request();
    }
  }
}
