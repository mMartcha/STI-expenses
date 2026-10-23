import { router, useLocalSearchParams } from 'expo-router';

import { ManualExpenseForm } from '@/presentation/components/ManualExpenseForm';

/** Despesa sem nota (ex.: táxi sem recibo). Opcionalmente já dentro de um relatório. */
export default function NewManualExpenseScreen() {
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  return <ManualExpenseForm reportId={reportId ?? null} onSaved={() => router.back()} />;
}
