import * as Linking from 'expo-linking';

import type { AuthBrowser, AuthBrowserResult } from '@/domain/gateways/AuthBrowser';

/** Rota de retorno do login; precisa estar cadastrada como redirect URI no App Registration do Entra ID. */
export const AUTH_CALLBACK_PATH = 'auth/callback';

/**
 * Abre o login no navegador do sistema (Custom Tabs no Android, ASWebAuthenticationSession no iOS),
 * nunca em WebView: assim funcionam SSO, MFA e o Microsoft Authenticator.
 * Em development build o retorno é `ocrstara://auth/callback`; no Expo Go seria `exp://…`.
 */
export class ExpoAuthBrowser implements AuthBrowser {
  async open(url: string): Promise<AuthBrowserResult> {
    // Importado sob demanda: um binário sem o módulo nativo não quebra o app ao iniciar.
    const WebBrowser = await import('expo-web-browser');
    const result = await WebBrowser.openAuthSessionAsync(url, Linking.createURL(AUTH_CALLBACK_PATH));
    if (result.type !== 'success') return { type: 'cancel' };

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(Linking.parse(result.url).queryParams ?? {})) {
      const single = Array.isArray(value) ? value[0] : value;
      if (typeof single === 'string') params[key] = single;
    }
    return { type: 'success', params };
  }
}
