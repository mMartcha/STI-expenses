// No Android, o retorno do login (`ocrstara://auth/callback?code=…`) também chega ao Expo Router.
// Quem trata esse retorno é o `openAuthSessionAsync`; aqui só evitamos a tela de "rota não encontrada".
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes('auth/callback')) return '/sign-in';
    return path;
  } catch {
    return '/';
  }
}
