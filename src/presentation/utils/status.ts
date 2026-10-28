import type { ExpenseCategory, PaymentMethod } from '@/domain/entities/ExpenseCategory';
import type { ReportStatus } from '@/domain/entities/ExpenseReport';

import type { IconName } from '../components/Icon';
import type { PillTone } from '../types/component.types';

export const CATEGORY_ICON: Record<ExpenseCategory, IconName> = {
  MEAL: 'categoryMeal',
  FUEL: 'categoryFuel',
  LODGING: 'categoryLodging',
  TRANSPORT: 'categoryTransport',
  TOLL: 'categoryToll',
  PARKING: 'categoryParking',
  SUPPLIES: 'categorySupplies',
  OTHER: 'categoryOther',
};

export const PAYMENT_METHOD_ICON: Record<PaymentMethod, IconName> = {
  CORPORATE_CARD: 'paymentCorporateCard',
  CREDIT_CARD: 'paymentCreditCard',
  DEBIT_CARD: 'paymentDebitCard',
  PIX: 'paymentPix',
  CASH: 'paymentCash',
  OTHER: 'paymentOther',
};

export const REPORT_STATUS_TONE: Record<ReportStatus, PillTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};
