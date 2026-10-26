import type { UseCase } from '@/core/UseCase';

import type { BiometricAuth } from '../../gateways/BiometricAuth';
import type { PreferencesRepository } from '../../repositories/PreferencesRepository';

/** Preferência por aparelho; o logout apaga as preferências, então cada usuário escolhe de novo. */
export const BIOMETRIC_LOCK_KEY = 'biometricLock';

export interface BiometricLockStatus {
  /** O aparelho tem biometria ou PIN/padrão cadastrado. */
  available: boolean;
  enabled: boolean;
  /** O usuário já respondeu à oferta (ativou ou recusou). */
  asked: boolean;
}

export class GetBiometricLockUseCase implements UseCase<void, BiometricLockStatus> {
  constructor(
    private readonly biometrics: BiometricAuth,
    private readonly preferences: PreferencesRepository,
  ) {}

  async execute(): Promise<BiometricLockStatus> {
    const [available, value] = await Promise.all([this.biometrics.isAvailable(), this.preferences.get(BIOMETRIC_LOCK_KEY)]);
    return { available, enabled: value === 'on', asked: value !== null };
  }
}
