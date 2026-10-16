import type { ExpenseReport, ReportStatus } from '../entities/ExpenseReport';

export interface ReportRepository {
  findById(id: string): Promise<ExpenseReport | null>;
  listByOwner(ownerId: string, statuses?: readonly ReportStatus[]): Promise<ExpenseReport[]>;
  save(report: ExpenseReport): Promise<void>;
  delete(id: string): Promise<void>;
  markSynced(id: string, version: number): Promise<void>;
}
