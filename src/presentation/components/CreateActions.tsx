import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionSheet, type ActionSheetItem } from './BottomSheet';
import { FloatingActions } from './FloatingActions';

/**
 * Espaço que listas e telas roláveis devem deixar no fim para o último item não ficar
 * escondido atrás dos botões flutuantes (some ao `insets.bottom`).
 */
export const CREATE_ACTIONS_CLEARANCE = 200;

/**
 * Criar é igual em todas as abas: câmera (escanear comprovante) e "+" com todas as formas
 * de criar. Use uma vez por tela de aba, como último filho do contêiner da tela.
 */
export function CreateActions() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const items: ActionSheetItem[] = [
    {
      key: 'expense',
      icon: 'receipt',
      label: t('home.actionExpense'),
      description: t('home.actionExpenseHint'),
      onPress: () => router.push({ pathname: '/capture', params: { mode: 'scan' } }),
    },
    {
      key: 'manual',
      icon: 'manual',
      label: t('home.actionManual'),
      description: t('home.actionManualHint'),
      onPress: () => router.push({ pathname: '/capture', params: { mode: 'manual' } }),
    },
    {
      key: 'report',
      icon: 'report',
      label: t('home.actionReport'),
      description: t('home.actionReportHint'),
      onPress: () => router.push('/report/new'),
    },
  ];

  return (
    <>
      <FloatingActions onScan={() => router.push({ pathname: '/capture', params: { mode: 'scan' } })} onCreate={() => setOpen(true)} />
      <ActionSheet visible={open} onClose={() => setOpen(false)} items={items} />
    </>
  );
}
