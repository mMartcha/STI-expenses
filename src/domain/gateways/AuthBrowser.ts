/** `cancel` = o usuário fechou o navegador sem concluir o login. */
export type AuthBrowserResult = { type: 'success'; params: Record<string, string> } | { type: 'cancel' };

/**
 * Abre a página de login do provedor no navegador do sistema e espera o redirecionamento
 * de volta para o app. Devolve os parâmetros da URL de retorno (`code`, `state` ou `error`).
 */
export interface AuthBrowser {
  open(url: string): Promise<AuthBrowserResult>;
}
