import type { LocalDataStore } from '@/domain/gateways/LocalDataStore';
import type { ReceiptStorage } from '@/domain/gateways/ReceiptStorage';

import type { Database } from '../database/client';
import { auditEntries, expenseItems, expenses, preferences, reports, syncOperations } from '../database/schema';

/** Apaga todos os dados do usuário no aparelho (logout). */
export class SqliteLocalDataStore implements LocalDataStore {
  constructor(
    private readonly db: Database,
    private readonly receipts: ReceiptStorage,
  ) {}

  async wipe(): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(syncOperations).run();
      tx.delete(auditEntries).run();
      tx.delete(expenseItems).run();
      tx.delete(expenses).run();
      tx.delete(reports).run();
      tx.delete(preferences).run();
    });
    await this.receipts.clearAll();
  }
}
