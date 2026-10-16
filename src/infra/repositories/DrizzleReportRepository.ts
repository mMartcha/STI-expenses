import { and, desc, eq, inArray } from 'drizzle-orm';

import type { ExpenseReport, ReportStatus } from '@/domain/entities/ExpenseReport';
import type { ReportRepository } from '@/domain/repositories/ReportRepository';

import type { Database } from '../database/client';
import { auditToRows, reportFromRows, reportToRow } from '../database/mappers';
import { auditEntries, reports } from '../database/schema';

type ReportRow = typeof reports.$inferSelect;

export class DrizzleReportRepository implements ReportRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<ExpenseReport | null> {
    const row = this.db.select().from(reports).where(eq(reports.id, id)).get();
    return row ? this.hydrate([row])[0] : null;
  }

  async listByOwner(ownerId: string, statuses?: readonly ReportStatus[]): Promise<ExpenseReport[]> {
    const where =
      statuses && statuses.length > 0
        ? and(eq(reports.ownerId, ownerId), inArray(reports.status, [...statuses]))
        : eq(reports.ownerId, ownerId);
    const rows = this.db.select().from(reports).where(where).orderBy(desc(reports.startDate)).all();
    return this.hydrate(rows);
  }

  async save(report: ExpenseReport): Promise<void> {
    const row = reportToRow(report);
    this.db.transaction((tx) => {
      tx.insert(reports).values(row).onConflictDoUpdate({ target: reports.id, set: row }).run();
      const history = auditToRows('REPORT', report.id, report.history);
      if (history.length > 0) tx.insert(auditEntries).values(history).onConflictDoNothing().run();
    });
  }

  async delete(id: string): Promise<void> {
    this.db.transaction((tx) => {
      tx.delete(auditEntries).where(and(eq(auditEntries.entityType, 'REPORT'), eq(auditEntries.entityId, id))).run();
      tx.delete(reports).where(eq(reports.id, id)).run();
    });
  }

  async markSynced(id: string, version: number): Promise<void> {
    this.db
      .update(reports)
      .set({ syncStatus: 'SYNCED' })
      .where(and(eq(reports.id, id), eq(reports.version, version)))
      .run();
  }

  private hydrate(rows: ReportRow[]): ExpenseReport[] {
    if (rows.length === 0) return [];
    const history = this.db
      .select()
      .from(auditEntries)
      .where(
        and(
          eq(auditEntries.entityType, 'REPORT'),
          inArray(
            auditEntries.entityId,
            rows.map((row) => row.id),
          ),
        ),
      )
      .all();
    return rows.map((row) => reportFromRows(row, history.filter((entry) => entry.entityId === row.id)));
  }
}
