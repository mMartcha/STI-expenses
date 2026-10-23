import { create } from 'zustand';

interface FeedbackState {
  /** Momento do último registro de despesa; a home mostra a confirmação enquanto estiver preenchido. */
  registeredAt: number | null;
  markRegistered: () => void;
  clearRegistered: () => void;
}

/** Avisos curtos que sobrevivem à navegação (ex.: tela de captura fecha e a home confirma). */
export const useFeedbackStore = create<FeedbackState>((set) => ({
  registeredAt: null,
  markRegistered: () => set({ registeredAt: Date.now() }),
  clearRegistered: () => set({ registeredAt: null }),
}));
