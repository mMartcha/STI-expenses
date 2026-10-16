import * as Network from 'expo-network';

export type ConnectivityListener = (online: boolean) => void;

function isOnline(state: Network.NetworkState): boolean {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

/** Observa a conectividade para disparar a sincronização quando a internet volta. */
export class ExpoNetworkMonitor {
  async isOnline(): Promise<boolean> {
    try {
      return isOnline(await Network.getNetworkStateAsync());
    } catch {
      // Na dúvida, tenta: a fila trata a falha e reagenda.
      return true;
    }
  }

  subscribe(listener: ConnectivityListener): () => void {
    const subscription = Network.addNetworkStateListener((state) => listener(isOnline(state)));
    return () => subscription.remove();
  }
}
