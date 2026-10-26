import type { UseCase } from '@/core/UseCase';

import type { BiometricAuth } from '../../gateways/BiometricAuth';

/**
 * Desbloqueia o app. Se o aparelho deixou de ter trava (o usuário removeu a biometria e o
 * PIN do celular), libera direto: sem trava no aparelho, o app não exige nada.
 */
export class UnlockWithBiometricsUseCase implements UseCase<{ prompt: string }, boolean> {
  constructor(private readonly biometrics: BiometricAuth) {}

  async execute({ prompt }: { prompt: string }): Promise<boolean> {
    if (!(await this.biometrics.isAvailable())) return true;
    return this.biometrics.authenticate(prompt);
  }
}
