/**
 * Trava do próprio aparelho: digital/rosto e, como alternativa, o PIN/padrão da tela de bloqueio.
 * Não substitui o login corporativo; só protege a sessão já salva no aparelho.
 */
export interface BiometricAuth {
  /** O aparelho tem alguma trava cadastrada (biometria ou PIN/padrão). */
  isAvailable(): Promise<boolean>;
  /** Mostra o pedido do sistema; `true` se o usuário confirmou. */
  authenticate(prompt: string): Promise<boolean>;
}
