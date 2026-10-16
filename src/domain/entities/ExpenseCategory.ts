export const EXPENSE_CATEGORIES = [
  'MEAL',
  'FUEL',
  'LODGING',
  'TRANSPORT',
  'TOLL',
  'PARKING',
  'SUPPLIES',
  'OTHER',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = ['CORPORATE_CARD', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'OTHER'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
