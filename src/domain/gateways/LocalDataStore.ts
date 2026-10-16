/** Operações de manutenção do armazenamento local (usado no logout). */
export interface LocalDataStore {
  wipe(): Promise<void>;
}
