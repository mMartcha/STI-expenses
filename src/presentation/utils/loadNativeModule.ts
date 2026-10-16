/**
 * Carrega um módulo com código nativo só quando a ação é usada.
 * Se o binário instalado não tiver o módulo (ex.: development build antigo), devolve
 * `null` em vez de derrubar a tela inteira na importação.
 */
export async function loadNativeModule<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (__DEV__) console.warn('[native] módulo indisponível neste build', error);
    return null;
  }
}
