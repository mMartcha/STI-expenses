import type { ReportStatus } from '@/domain/entities/ExpenseReport';

import type { PillTone } from '../components/ui';

export const REPORT_STATUS_TONE: Record<ReportStatus, PillTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};
