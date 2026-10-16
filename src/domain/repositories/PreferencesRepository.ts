/** Preferências/estados simples do usuário no aparelho (chave → valor). */
export interface PreferencesRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
