import { create } from 'zustand';

import type { User } from '@/domain/entities/User';

/** `locked` = há sessão, mas o app espera a biometria (a navegação fica intacta por baixo). */
type SessionStatus = 'restoring' | 'signedIn' | 'locked' | 'signedOut';

interface SessionState {
  status: SessionStatus;
  user: User | null;
  /** Espelho da preferência salva, para travar na hora (sem esperar o banco) ao voltar ao app. */
  biometricLock: boolean;
  setUser: (user: User | null, options?: { locked?: boolean }) => void;
  setBiometricLock: (enabled: boolean) => void;
  lock: () => void;
  unlock: () => void;
}

/** Estado global de UI da sessão (os tokens ficam no SecureStore, nunca aqui). */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'restoring',
  user: null,
  biometricLock: false,
  setUser: (user, options) => set({ user, status: user ? (options?.locked ? 'locked' : 'signedIn') : 'signedOut' }),
  setBiometricLock: (biometricLock) => set({ biometricLock }),
  lock: () => set((state) => (state.status === 'signedIn' ? { status: 'locked' } : state)),
  unlock: () => set((state) => (state.status === 'locked' ? { status: 'signedIn' } : state)),
}));
