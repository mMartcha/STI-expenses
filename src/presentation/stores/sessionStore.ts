import { create } from 'zustand';

import type { User } from '@/domain/entities/User';

type SessionStatus = 'restoring' | 'signedIn' | 'signedOut';

interface SessionState {
  status: SessionStatus;
  user: User | null;
  setUser: (user: User | null) => void;
}

/** Estado global de UI da sessão (os tokens ficam no SecureStore, nunca aqui). */
export const useSessionStore = create<SessionState>((set) => ({
  status: 'restoring',
  user: null,
  setUser: (user) => set({ user, status: user ? 'signedIn' : 'signedOut' }),
}));
