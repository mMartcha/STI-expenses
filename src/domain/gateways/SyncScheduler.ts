/** Pede uma rodada de sincronização (executa já se houver internet, senão quando voltar). */
export interface SyncScheduler {
  request(): void;
}
