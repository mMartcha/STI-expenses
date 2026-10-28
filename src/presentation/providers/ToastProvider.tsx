import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import { Toast } from '../components/Toast';
import type { ToastType } from '../types/component.types';
import { haptics } from '../utils/haptics';

interface ToastValue {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

/**
 * Um toast por vez, por cima de tudo (mesma ideia do `ToastContext` do app-stara-ai). Um novo
 * substitui o atual; a `key` reinicia a animação e o tempo.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; type: ToastType } | null>(null);

  // Estável: o valor do contexto não muda e os consumidores não redesenham a cada toast.
  const showToast = useCallback((message: string, type: ToastType) => {
    // Sucesso e erro vibram junto; o aviso (`info`) fica só na tela.
    if (type === 'success') haptics.success();
    if (type === 'error') haptics.error();
    setToast({ id: Date.now(), message, type });
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Overlay>
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </View>
        </Overlay>
      ) : null}
    </ToastContext.Provider>
  );
}

/** No iOS, telas `presentation: 'modal'` ficam acima da árvore raiz; o `FullWindowOverlay` desenha por cima delas. */
function Overlay({ children }: { children: ReactNode }) {
  return Platform.OS === 'ios' ? <FullWindowOverlay>{children}</FullWindowOverlay> : <>{children}</>;
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return value;
}
