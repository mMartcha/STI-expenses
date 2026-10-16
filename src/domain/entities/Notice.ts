/**
 * Aviso exibido no sino da home.
 * - Eventos (decisão do gestor) ficam "não lidos" até o usuário abrir a tela de avisos.
 * - Pendências (OCR falhou, envio falhou) continuam sinalizadas enquanto existirem.
 */
export type NoticeType = 'REPORT_APPROVED' | 'REPORT_REJECTED' | 'OCR_FAILED' | 'SYNC_FAILED';

export interface Notice {
  readonly id: string;
  readonly type: NoticeType;
  /** Id da despesa ou do relatório relacionado; `null` para avisos gerais. */
  readonly targetId: string | null;
  /** Nome amigável do alvo (título do relatório, estabelecimento…). */
  readonly targetLabel: string | null;
  readonly at: string;
  readonly unread: boolean;
  readonly requiresAction: boolean;
}

export interface NoticeFeed {
  notices: Notice[];
  /** Mostra o ponto no sino. */
  hasAttention: boolean;
}
