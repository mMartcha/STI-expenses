import type { CurrencyCode } from '../shared/Money';
import type { ExpenseCategory, PaymentMethod } from './ExpenseCategory';

/**
 * Resultado normalizado do OCR (já validado na fronteira da infraestrutura).
 * Valores monetários em centavos. Fica guardado na despesa como "leitura original"
 * para o gestor comparar com o que o colaborador editou.
 */
export interface OcrResult {
  merchant: { name: string; taxId: string | null } | null;
  occurredAt: string | null;
  paymentMethod: PaymentMethod | null;
  suggestedCategory: ExpenseCategory | null;
  currency: CurrencyCode;
  items: OcrItem[];
  discount: number;
  total: number;
  /** Confiança geral da leitura, de 0 a 1. */
  confidence: number;
}

export interface OcrItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}
