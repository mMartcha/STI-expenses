import type { Logger } from '@/core/ports';
import type { BiometricAuth } from '@/domain/gateways/BiometricAuth';

// Importado sob demanda: um binário sem o módulo nativo não quebra o app ao iniciar.
const loadModule = () => import('expo-local-authentication');

/** Biometria via `expo-local-authentication`, com o PIN/padrão do celular como alternativa (padrão do sistema). */
export class ExpoBiometricAuth implements BiometricAuth {
  constructor(private readonly logger: Logger) {}

  async isAvailable(): Promise<boolean> {
    try {
      const LocalAuthentication = await loadModule();
      return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
    } catch (error) {
      this.logger.warn('Biometria indisponível neste build', { error });
      return false;
    }
  }

  async authenticate(prompt: string): Promise<boolean> {
    const LocalAuthentication = await loadModule();
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: prompt });
    return result.success;
  }
}
