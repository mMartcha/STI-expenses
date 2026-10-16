import { createContext, useContext, type ReactNode } from 'react';

import type { Container } from '@/di/container';

const DependenciesContext = createContext<Container | null>(null);

/** Injeta os casos de uso na árvore React (permite trocar por fakes em testes de tela). */
export function DependenciesProvider({ container, children }: { container: Container; children: ReactNode }) {
  return <DependenciesContext.Provider value={container}>{children}</DependenciesContext.Provider>;
}

export function useDependencies(): Container {
  const value = useContext(DependenciesContext);
  if (!value) throw new Error('useDependencies deve ser usado dentro de <DependenciesProvider>');
  return value;
}
