import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ManualExpenseForm } from '@/presentation/components';
import { useToast } from '@/presentation/providers/ToastProvider';

/** Despesa sem nota (ex.: táxi sem recibo). Opcionalmente já dentro de um relatório. */
export default function NewExpenseScreen() {
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  const { t } = useTranslation();
  const { showToast } = useToast();
  return (
    <ManualExpenseForm
      reportId={reportId ?? null}
      onSaved={() => {
        showToast(t('toasts.expenseCreated'), 'success');
        router.back();
      }}
    />
  );
}
