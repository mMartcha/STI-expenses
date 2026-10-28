import { create } from 'zustand';

interface FeedbackState {
  /**
   * A dica do modo "vários comprovantes" já apareceu nesta sessão do app.
   * TODO: persistir em `PreferencesRepository` para mostrar uma única vez por usuário.
   */
  batchTipSeen: boolean;
  markBatchTipSeen: () => void;
}

/** Estado de UI que sobrevive à navegação (ex.: a dica do modo lote já apareceu). */
export const useFeedbackStore = create<FeedbackState>((set) => ({
  batchTipSeen: false,
  markBatchTipSeen: () => set({ batchTipSeen: true }),
}));
