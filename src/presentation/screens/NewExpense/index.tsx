import { router, useLocalSearchParams } from 'expo-router';

import { ManualExpenseForm } from '@/presentation/components';

/** Despesa sem nota (ex.: táxi sem recibo). Opcionalmente já dentro de um relatório. */
export default function NewExpenseScreen() {
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  return <ManualExpenseForm reportId={reportId ?? null} onSaved={() => router.back()} />;
}
