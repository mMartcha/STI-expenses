import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ReportStatus } from '@/domain/entities/ExpenseReport';
import type { ListExpensesInput } from '@/domain/usecases/expense/ListExpensesUseCase';

import { useDependencies } from '../providers/DependenciesProvider';

export const queryKeys = {
  expenses: (filter: ListExpensesInput) => ['expenses', 'list', filter] as const,
  expense: (id: string) => ['expenses', 'detail', id] as const,
  reports: (statuses?: ReportStatus[]) => ['reports', 'list', statuses ?? 'all'] as const,
  report: (id: string) => ['reports', 'detail', id] as const,
  syncStatus: ['sync', 'status'] as const,
  notices: ['notices'] as const,
};

/**
 * Os dados vêm do SQLite local, então as queries devem rodar mesmo offline
 * (`networkMode: 'always'`) e podem ser revalidadas à vontade (custo baixo).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { networkMode: 'always', staleTime: 0, gcTime: 5 * 60_000, retry: 1 },
      mutations: { networkMode: 'always', retry: false },
    },
  });
}

// ---------- Leitura ----------

export function useExpenses(filter: ListExpensesInput) {
  const { listExpensesUseCase } = useDependencies();
  return useQuery({ queryKey: queryKeys.expenses(filter), queryFn: () => listExpensesUseCase.execute(filter) });
}

export function useExpense(expenseId: string) {
  const { getExpenseUseCase } = useDependencies();
  return useQuery({
    queryKey: queryKeys.expense(expenseId),
    queryFn: () => getExpenseUseCase.execute({ expenseId }),
    // Enquanto o OCR roda, atualiza a tela periodicamente.
    refetchInterval: (query) => (query.state.data?.ocrStatus === 'PENDING' ? 2_000 : false),
  });
}

export function useReports(statuses?: ReportStatus[]) {
  const { listReportsUseCase } = useDependencies();
  return useQuery({ queryKey: queryKeys.reports(statuses), queryFn: () => listReportsUseCase.execute({ statuses }) });
}

export function useReportDetails(reportId: string | null) {
  const { getReportDetailsUseCase } = useDependencies();
  return useQuery({
    queryKey: queryKeys.report(reportId ?? ''),
    queryFn: () => getReportDetailsUseCase.execute({ reportId: reportId! }),
    enabled: Boolean(reportId),
    refetchInterval: (query) => ((query.state.data?.summary.pendingOcrIds.length ?? 0) > 0 ? 3_000 : false),
  });
}

export function useSyncStatus() {
  const { getSyncStatusUseCase } = useDependencies();
  return useQuery({ queryKey: queryKeys.syncStatus, queryFn: () => getSyncStatusUseCase.execute(), refetchInterval: 10_000 });
}

export function useNotices() {
  const { listNoticesUseCase } = useDependencies();
  return useQuery({ queryKey: queryKeys.notices, queryFn: () => listNoticesUseCase.execute(), refetchInterval: 30_000 });
}

// ---------- Escrita ----------

/**
 * Executa um caso de uso e revalida as telas. Como tudo é local, invalidar
 * despesas, relatórios e status de sync é barato e mantém a UI consistente.
 */
export function useUseCaseMutation<TInput, TOutput>(run: (input: TInput) => Promise<TOutput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['sync'] }),
        queryClient.invalidateQueries({ queryKey: ['notices'] }),
      ]),
  });
}
