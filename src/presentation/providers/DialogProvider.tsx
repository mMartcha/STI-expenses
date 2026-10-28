import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogActions } from '../components/Dialog';
import type { IconName } from '../components/Icon';
import { haptics } from '../utils/haptics';

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Rótulo da ação principal (padrão: "Confirmar"). */
  confirmLabel?: string;
  /** Rótulo do cancelar; `null` = diálogo só com a ação principal. */
  cancelLabel?: string | null;
  /** Ícone à esquerda do título (ex.: `send` no envio para aprovação). */
  icon?: IconName;
  /** Ação principal em vermelho (excluir, descartar, sair com pendências). */
  destructive?: boolean;
  /** `false` = só fecha pelos botões (tocar fora e o "voltar" do Android não fecham). */
  dismissable?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const DialogContext = createContext<ConfirmFn | null>(null);

/**
 * Um diálogo de confirmação por vez para o app inteiro. `confirm()` devolve uma Promise que
 * resolve com `true` (ação principal) ou `false` (cancelar / tocar fora).
 */
export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  // As opções continuam guardadas ao fechar: o texto não some enquanto o fade de saída roda.
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (next) =>
      new Promise<boolean>((resolve) => {
        // Se já havia um aberto, ele conta como cancelado.
        resolver.current?.(false);
        resolver.current = resolve;
        if (next.destructive) haptics.warning();
        setOptions(next);
        setOpen(true);
      }),
    [],
  );

  const answer = (confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setOpen(false);
  };

  const cancelLabel = options?.cancelLabel === undefined ? t('common.cancel') : options.cancelLabel;

  return (
    <DialogContext.Provider value={confirm}>
      {children}
      <Dialog
        visible={open}
        title={options?.title ?? ''}
        message={options?.message}
        icon={options?.icon}
        destructive={options?.destructive}
        dismissable={options?.dismissable}
        onClose={() => answer(false)}>
        <DialogActions
          confirmLabel={options?.confirmLabel ?? t('common.confirm')}
          cancelLabel={cancelLabel}
          destructive={options?.destructive}
          onConfirm={() => answer(true)}
          onCancel={() => answer(false)}
        />
      </Dialog>
    </DialogContext.Provider>
  );
}

/** `if (await confirm({ title, message, destructive: true })) { … }` */
export function useConfirm(): ConfirmFn {
  const value = useContext(DialogContext);
  if (!value) throw new Error('useConfirm deve ser usado dentro de <DialogProvider>');
  return value;
}
