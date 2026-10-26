import { DomainError } from '@/core/errors';
import type { Session } from '@/domain/entities/User';
import type { AuthBrowser, AuthBrowserResult } from '@/domain/gateways/AuthBrowser';
import type { AuthGateway, AuthorizationCallback } from '@/domain/gateways/AuthGateway';
import type { BiometricAuth } from '@/domain/gateways/BiometricAuth';
import type { PreferencesRepository } from '@/domain/repositories/PreferencesRepository';
import { GetBiometricLockUseCase } from '@/domain/usecases/auth/GetBiometricLockUseCase';
import { SetBiometricLockUseCase } from '@/domain/usecases/auth/SetBiometricLockUseCase';
import { SignInUseCase } from '@/domain/usecases/auth/SignInUseCase';
import { UnlockWithBiometricsUseCase } from '@/domain/usecases/auth/UnlockWithBiometricsUseCase';

import { FakeSessionRepository, USER } from '../../helpers/fakes';

const SESSION: Session = { user: USER, accessToken: 'jwt', refreshToken: 'r', expiresAt: '2099-01-01T00:00:00.000Z' };

class FakeAuthGateway implements AuthGateway {
  callbacks: AuthorizationCallback[] = [];
  async getAuthorizationUrl() {
    return 'https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?state=s1';
  }
  async completeSignIn(callback: AuthorizationCallback) {
    this.callbacks.push(callback);
    return SESSION;
  }
  async refresh() {
    return SESSION;
  }
  async signOut() {}
}

class FakeAuthBrowser implements AuthBrowser {
  opened: string[] = [];
  constructor(private readonly result: AuthBrowserResult) {}
  async open(url: string) {
    this.opened.push(url);
    return this.result;
  }
}

function setup(result: AuthBrowserResult) {
  const auth = new FakeAuthGateway();
  const browser = new FakeAuthBrowser(result);
  const sessions = new FakeSessionRepository(null);
  return { auth, browser, sessions, useCase: new SignInUseCase(auth, browser, sessions) };
}

describe('SignInUseCase', () => {
  it('abre a URL do backend, envia code/state do callback e salva a sessão', async () => {
    const { auth, browser, sessions, useCase } = setup({ type: 'success', params: { code: 'c1', state: 's1' } });
    const onValidating = jest.fn();

    const user = await useCase.execute({ onValidating });

    expect(browser.opened).toEqual(['https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?state=s1']);
    expect(auth.callbacks).toEqual([{ code: 'c1', state: 's1' }]);
    expect(onValidating).toHaveBeenCalledTimes(1);
    expect(sessions.session).toEqual(SESSION);
    expect(user).toEqual(USER);
  });

  it('devolve null sem chamar o backend quando o usuário fecha o navegador', async () => {
    const { auth, sessions, useCase } = setup({ type: 'cancel' });

    await expect(useCase.execute()).resolves.toBeNull();
    expect(auth.callbacks).toHaveLength(0);
    expect(sessions.session).toBeNull();
  });

  it('falha quando o provedor devolve erro no callback', async () => {
    const { auth, useCase } = setup({ type: 'success', params: { error: 'access_denied' } });

    await expect(useCase.execute()).rejects.toMatchObject({ code: 'SIGN_IN_FAILED' });
    expect(auth.callbacks).toHaveLength(0);
  });

  it('falha quando o callback não traz code ou state', async () => {
    const { useCase } = setup({ type: 'success', params: { code: 'c1' } });

    await expect(useCase.execute()).rejects.toBeInstanceOf(DomainError);
  });
});

class FakeBiometrics implements BiometricAuth {
  prompts: string[] = [];
  constructor(
    public available = true,
    public confirms = true,
  ) {}
  async isAvailable() {
    return this.available;
  }
  async authenticate(prompt: string) {
    this.prompts.push(prompt);
    return this.confirms;
  }
}

class MemoryPreferences implements PreferencesRepository {
  readonly values = new Map<string, string>();
  async get(key: string) {
    return this.values.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('Trava por biometria', () => {
  it('começa desligada e ainda não oferecida', async () => {
    const status = await new GetBiometricLockUseCase(new FakeBiometrics(), new MemoryPreferences()).execute();
    expect(status).toEqual({ available: true, enabled: false, asked: false });
  });

  it('liga só depois de o usuário confirmar a biometria', async () => {
    const biometrics = new FakeBiometrics();
    const preferences = new MemoryPreferences();

    await expect(new SetBiometricLockUseCase(biometrics, preferences).execute({ enabled: true, prompt: 'p' })).resolves.toBe(true);
    expect(biometrics.prompts).toEqual(['p']);
    await expect(new GetBiometricLockUseCase(biometrics, preferences).execute()).resolves.toMatchObject({ enabled: true, asked: true });
  });

  it('não liga (nem marca como oferecida) se a confirmação falhar', async () => {
    const preferences = new MemoryPreferences();

    await expect(new SetBiometricLockUseCase(new FakeBiometrics(true, false), preferences).execute({ enabled: true, prompt: 'p' })).resolves.toBe(false);
    expect(preferences.values.size).toBe(0);
  });

  it('recusar a oferta grava "desligado" sem pedir biometria', async () => {
    const biometrics = new FakeBiometrics();
    const preferences = new MemoryPreferences();

    await new SetBiometricLockUseCase(biometrics, preferences).execute({ enabled: false, prompt: 'p' });
    expect(biometrics.prompts).toHaveLength(0);
    await expect(new GetBiometricLockUseCase(biometrics, preferences).execute()).resolves.toMatchObject({ enabled: false, asked: true });
  });

  it('desbloqueia direto se o aparelho não tem mais trava', async () => {
    const biometrics = new FakeBiometrics(false, false);
    await expect(new UnlockWithBiometricsUseCase(biometrics).execute({ prompt: 'p' })).resolves.toBe(true);
    expect(biometrics.prompts).toHaveLength(0);
  });

  it('continua bloqueado se a biometria falhar', async () => {
    await expect(new UnlockWithBiometricsUseCase(new FakeBiometrics(true, false)).execute({ prompt: 'p' })).resolves.toBe(false);
  });
});
