import { create } from 'zustand';

interface FeedbackState {
  /** Último registro de despesa(s); a home mostra a confirmação enquanto estiver preenchido. */
  registered: { at: number; count: number } | null;
  markRegistered: (count?: number) => void;
  clearRegistered: () => void;
  /**
   * A dica do modo "vários comprovantes" já apareceu nesta sessão do app.
   * TODO: persistir em `PreferencesRepository` para mostrar uma única vez por usuário.
   */
  batchTipSeen: boolean;
  markBatchTipSeen: () => void;
}

/** Avisos curtos que sobrevivem à navegação (ex.: tela de captura fecha e a home confirma). */
export const useFeedbackStore = create<FeedbackState>((set) => ({
  registered: null,
  markRegistered: (count = 1) => set({ registered: { at: Date.now(), count } }),
  clearRegistered: () => set({ registered: null }),
  batchTipSeen: false,
  markBatchTipSeen: () => set({ batchTipSeen: true }),
}));
