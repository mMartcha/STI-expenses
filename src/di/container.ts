import Constants from 'expo-constants';

import { env } from '@/config/env';
import type { AuthBrowser } from '@/domain/gateways/AuthBrowser';
import type { AuthGateway } from '@/domain/gateways/AuthGateway';
import type { ExpenseSyncGateway } from '@/domain/gateways/ExpenseSyncGateway';
import type { OcrGateway } from '@/domain/gateways/OcrGateway';
import { GetBiometricLockUseCase } from '@/domain/usecases/auth/GetBiometricLockUseCase';
import { RestoreSessionUseCase } from '@/domain/usecases/auth/RestoreSessionUseCase';
import { SetBiometricLockUseCase } from '@/domain/usecases/auth/SetBiometricLockUseCase';
import { SignInUseCase } from '@/domain/usecases/auth/SignInUseCase';
import { SignOutUseCase } from '@/domain/usecases/auth/SignOutUseCase';
import { UnlockWithBiometricsUseCase } from '@/domain/usecases/auth/UnlockWithBiometricsUseCase';
import { AddExpenseItemUseCase } from '@/domain/usecases/expense/AddExpenseItemUseCase';
import { CaptureReceiptBatchUseCase } from '@/domain/usecases/expense/CaptureReceiptBatchUseCase';
import { CaptureReceiptUseCase } from '@/domain/usecases/expense/CaptureReceiptUseCase';
import { CreateManualExpenseUseCase } from '@/domain/usecases/expense/CreateManualExpenseUseCase';
import { DeleteExpenseUseCase } from '@/domain/usecases/expense/DeleteExpenseUseCase';
import type { ExpenseMutationDeps } from '@/domain/usecases/expense/ExpenseMutation';
import { GetExpenseUseCase } from '@/domain/usecases/expense/GetExpenseUseCase';
import { ListExpensesUseCase } from '@/domain/usecases/expense/ListExpensesUseCase';
import { RemoveExpenseItemUseCase } from '@/domain/usecases/expense/RemoveExpenseItemUseCase';
import { RestoreExpenseItemUseCase } from '@/domain/usecases/expense/RestoreExpenseItemUseCase';
import { RetryOcrUseCase } from '@/domain/usecases/expense/RetryOcrUseCase';
import { UpdateExpenseDetailsUseCase } from '@/domain/usecases/expense/UpdateExpenseDetailsUseCase';
import { UpdateExpenseItemUseCase } from '@/domain/usecases/expense/UpdateExpenseItemUseCase';
import { AttachExpensesToReportUseCase } from '@/domain/usecases/report/AttachExpensesToReportUseCase';
import { CreateReportUseCase } from '@/domain/usecases/report/CreateReportUseCase';
import { DeleteReportUseCase } from '@/domain/usecases/report/DeleteReportUseCase';
import { DetachExpenseFromReportUseCase } from '@/domain/usecases/report/DetachExpenseFromReportUseCase';
import { ListNoticesUseCase } from '@/domain/usecases/notice/ListNoticesUseCase';
import { MarkNoticesSeenUseCase } from '@/domain/usecases/notice/MarkNoticesSeenUseCase';
import { GetReportDetailsUseCase } from '@/domain/usecases/report/GetReportDetailsUseCase';
import { ListReportsUseCase } from '@/domain/usecases/report/ListReportsUseCase';
import { RefreshReportDecisionsUseCase } from '@/domain/usecases/report/RefreshReportDecisionsUseCase';
import type { ReportDeps } from '@/domain/usecases/report/ReportDeps';
import { SubmitReportUseCase } from '@/domain/usecases/report/SubmitReportUseCase';
import { UpdateReportUseCase } from '@/domain/usecases/report/UpdateReportUseCase';
import { GetSyncStatusUseCase } from '@/domain/usecases/sync/GetSyncStatusUseCase';
import { ProcessSyncQueueUseCase } from '@/domain/usecases/sync/ProcessSyncQueueUseCase';
import { RetryFailedSyncUseCase } from '@/domain/usecases/sync/RetryFailedSyncUseCase';
import { ExpoAuthBrowser } from '@/infra/auth/ExpoAuthBrowser';
import { ExpoBiometricAuth } from '@/infra/auth/ExpoBiometricAuth';
import { db } from '@/infra/database/client';
import { HttpAuthGateway } from '@/infra/gateways/http/HttpAuthGateway';
import { HttpExpenseSyncGateway } from '@/infra/gateways/http/HttpExpenseSyncGateway';
import { HttpOcrGateway } from '@/infra/gateways/http/HttpOcrGateway';
import { MockAuthBrowser, MockAuthGateway } from '@/infra/gateways/mock/MockAuthGateway';
import { MockExpenseSyncGateway } from '@/infra/gateways/mock/MockExpenseSyncGateway';
import { MockOcrGateway } from '@/infra/gateways/mock/MockOcrGateway';
import { HttpClient } from '@/infra/http/HttpClient';
import { ExpoNetworkMonitor } from '@/infra/network/ExpoNetworkMonitor';
import { DrizzleExpenseRepository } from '@/infra/repositories/DrizzleExpenseRepository';
import { DrizzlePreferencesRepository } from '@/infra/repositories/DrizzlePreferencesRepository';
import { DrizzleReportRepository } from '@/infra/repositories/DrizzleReportRepository';
import { DrizzleSyncQueue } from '@/infra/repositories/DrizzleSyncQueue';
import { FileSystemReceiptStorage } from '@/infra/storage/FileSystemReceiptStorage';
import { SecureStoreSessionRepository } from '@/infra/storage/SecureStoreSessionRepository';
import { SqliteLocalDataStore } from '@/infra/storage/SqliteLocalDataStore';
import { SyncEngine } from '@/infra/sync/SyncEngine';
import { ConsoleLogger, CryptoIdGenerator, SystemClock } from '@/infra/system/system';

/**
 * Composition root: o ÚNICO lugar que conhece as implementações concretas.
 * Para trocar mock → API real basta `EXPO_PUBLIC_USE_MOCKS=false`; nenhum caso de uso muda.
 */
function createContainer() {
  // ---- Infra base ----
  const logger = new ConsoleLogger(__DEV__);
  const clock = new SystemClock();
  const ids = new CryptoIdGenerator();
  const network = new ExpoNetworkMonitor();

  const sessions = new SecureStoreSessionRepository(logger);
  const expenses = new DrizzleExpenseRepository(db);
  const reports = new DrizzleReportRepository(db);
  const queue = new DrizzleSyncQueue(db, clock, ids);
  const preferences = new DrizzlePreferencesRepository(db);
  // Biometria é do aparelho: a mesma implementação nos modos mock e real.
  const biometrics = new ExpoBiometricAuth(logger);
  const receipts = new FileSystemReceiptStorage(ids, logger);
  const localData = new SqliteLocalDataStore(db, receipts);

  // ---- Gateways (mock ou HTTP) ----
  let auth: AuthGateway;
  let authBrowser: AuthBrowser;
  let ocr: OcrGateway;
  let remote: ExpenseSyncGateway;

  if (env.useMocks) {
    auth = new MockAuthGateway(ids);
    authBrowser = new MockAuthBrowser();
    ocr = new MockOcrGateway(ids, { unreadableRate: 0 });
    // Modo de teste: o "gestor" aprova 10 min após o envio (dá tempo de ver o andamento na Início).
    remote = new MockExpenseSyncGateway({ autoApproveAfterMs: 10 * 60_000 });
  } else {
    let httpAuth: AuthGateway | null = null;
    const http = new HttpClient(
      env.apiUrl,
      {
        getAccessToken: () => sessions.current()?.accessToken ?? null,
        refreshAccessToken: async () => {
          const current = sessions.current();
          if (!current || !httpAuth) return null;
          try {
            const renewed = await httpAuth.refresh(current.refreshToken);
            await sessions.save(renewed);
            return renewed.accessToken;
          } catch {
            return null;
          }
        },
      },
      logger,
      Constants.expoConfig?.version ?? '0.0.0',
    );
    auth = httpAuth = new HttpAuthGateway(http);
    authBrowser = new ExpoAuthBrowser();
    ocr = new HttpOcrGateway(http);
    remote = new HttpExpenseSyncGateway(http);
  }

  // ---- Sincronização ----
  const processSyncQueue = new ProcessSyncQueueUseCase(queue, expenses, reports, ocr, remote, clock, ids, logger);
  const refreshReportDecisions = new RefreshReportDecisionsUseCase(reports, expenses, remote, sessions, clock, ids);
  const syncEngine = new SyncEngine(processSyncQueue, refreshReportDecisions, network, logger);

  const expenseDeps: ExpenseMutationDeps = { expenses, reports, queue, scheduler: syncEngine, sessions, clock, ids };
  const reportDeps: ReportDeps = { reports, expenses, queue, scheduler: syncEngine, sessions, clock, ids };
  const captureReceipt = new CaptureReceiptUseCase(expenses, receipts, queue, syncEngine, sessions, clock, ids);

  return {
    logger,
    syncEngine,

    // auth
    signInUseCase: new SignInUseCase(auth, authBrowser, sessions),
    signOutUseCase: new SignOutUseCase(auth, sessions, queue, localData, logger),
    restoreSessionUseCase: new RestoreSessionUseCase(sessions, auth, clock, logger),
    getBiometricLockUseCase: new GetBiometricLockUseCase(biometrics, preferences),
    setBiometricLockUseCase: new SetBiometricLockUseCase(biometrics, preferences),
    unlockWithBiometricsUseCase: new UnlockWithBiometricsUseCase(biometrics),

    // despesas
    captureReceiptUseCase: captureReceipt,
    captureReceiptBatchUseCase: new CaptureReceiptBatchUseCase(captureReceipt),
    createManualExpenseUseCase: new CreateManualExpenseUseCase(expenses, reports, queue, syncEngine, sessions, clock, ids),
    getExpenseUseCase: new GetExpenseUseCase(expenses, sessions),
    listExpensesUseCase: new ListExpensesUseCase(expenses, sessions),
    updateExpenseDetailsUseCase: new UpdateExpenseDetailsUseCase(expenseDeps),
    addExpenseItemUseCase: new AddExpenseItemUseCase(expenseDeps),
    updateExpenseItemUseCase: new UpdateExpenseItemUseCase(expenseDeps),
    removeExpenseItemUseCase: new RemoveExpenseItemUseCase(expenseDeps),
    restoreExpenseItemUseCase: new RestoreExpenseItemUseCase(expenseDeps),
    retryOcrUseCase: new RetryOcrUseCase(expenseDeps),
    deleteExpenseUseCase: new DeleteExpenseUseCase(expenseDeps, receipts),

    // relatórios
    createReportUseCase: new CreateReportUseCase(reportDeps),
    updateReportUseCase: new UpdateReportUseCase(reportDeps),
    listReportsUseCase: new ListReportsUseCase(reports, expenses, sessions),
    getReportDetailsUseCase: new GetReportDetailsUseCase(reports, expenses, sessions),
    attachExpensesToReportUseCase: new AttachExpensesToReportUseCase(reportDeps),
    detachExpenseFromReportUseCase: new DetachExpenseFromReportUseCase(reportDeps),
    submitReportUseCase: new SubmitReportUseCase(reportDeps),
    deleteReportUseCase: new DeleteReportUseCase(reportDeps),
    refreshReportDecisionsUseCase: refreshReportDecisions,

    // avisos (sino)
    listNoticesUseCase: new ListNoticesUseCase(reports, expenses, queue, preferences, sessions, clock),
    markNoticesSeenUseCase: new MarkNoticesSeenUseCase(preferences, sessions, clock),

    // sincronização
    getSyncStatusUseCase: new GetSyncStatusUseCase(queue),
    retryFailedSyncUseCase: new RetryFailedSyncUseCase(queue, syncEngine, clock),
  };
}

export type Container = ReturnType<typeof createContainer>;

export const container: Container = createContainer();
