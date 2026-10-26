import type { UseCase } from '@/core/UseCase';

import type { BiometricAuth } from '../../gateways/BiometricAuth';
import type { PreferencesRepository } from '../../repositories/PreferencesRepository';
import { BIOMETRIC_LOCK_KEY } from './GetBiometricLockUseCase';

export interface SetBiometricLockInput {
  enabled: boolean;
  /** Texto do pedido do sistema ao ativar. */
  prompt: string;
}

/**
 * Liga ou desliga o desbloqueio por biometria. Para ligar, o usuário confirma uma vez
 * (garante que a trava funciona no aparelho). Devolve o estado final.
 */
export class SetBiometricLockUseCase implements UseCase<SetBiometricLockInput, boolean> {
  constructor(
    private readonly biometrics: BiometricAuth,
    private readonly preferences: PreferencesRepository,
  ) {}

  async execute({ enabled, prompt }: SetBiometricLockInput): Promise<boolean> {
    if (enabled) {
      const confirmed = (await this.biometrics.isAvailable()) && (await this.biometrics.authenticate(prompt));
      if (!confirmed) return false;
    }
    await this.preferences.set(BIOMETRIC_LOCK_KEY, enabled ? 'on' : 'off');
    return enabled;
  }
}
