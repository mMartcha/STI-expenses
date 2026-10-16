import type { OcrResult } from '@/domain/entities/OcrResult';

type Fixture = Omit<OcrResult, 'occurredAt'>;

/** Notas de exemplo devolvidas pelo OCR simulado (em rodízio). */
export const OCR_FIXTURES: Fixture[] = [
  {
    merchant: { name: 'Restaurante Sabor Gaúcho', taxId: '12345678000190' },
    paymentMethod: 'CORPORATE_CARD',
    suggestedCategory: 'MEAL',
    currency: 'BRL',
    items: [
      { description: 'Buffet livre', quantity: 1, unitPrice: 5990, total: 5990 },
      { description: 'Refrigerante lata', quantity: 1, unitPrice: 700, total: 700 },
      { description: 'Cerveja long neck', quantity: 2, unitPrice: 1200, total: 2400 },
      { description: 'Sobremesa pudim', quantity: 1, unitPrice: 1500, total: 1500 },
    ],
    discount: 0,
    total: 10590,
    confidence: 0.94,
  },
  {
    merchant: { name: 'Posto Rota Sul', taxId: '98765432000110' },
    paymentMethod: 'CORPORATE_CARD',
    suggestedCategory: 'FUEL',
    currency: 'BRL',
    items: [
      { description: 'Diesel S10', quantity: 62.35, unitPrice: 609, total: 37971 },
      { description: 'Aditivo Arla 32', quantity: 1, unitPrice: 8990, total: 8990 },
      { description: 'Água mineral 500ml', quantity: 2, unitPrice: 450, total: 900 },
    ],
    discount: 0,
    total: 47861,
    confidence: 0.91,
  },
  {
    merchant: { name: 'Hotel Planalto', taxId: '11222333000144' },
    paymentMethod: 'CREDIT_CARD',
    suggestedCategory: 'LODGING',
    currency: 'BRL',
    items: [
      { description: 'Diária apartamento single', quantity: 1, unitPrice: 28900, total: 28900 },
      { description: 'Frigobar', quantity: 1, unitPrice: 3200, total: 3200 },
      { description: 'Lavanderia', quantity: 1, unitPrice: 4500, total: 4500 },
    ],
    discount: 2890,
    total: 33710,
    confidence: 0.88,
  },
  {
    merchant: { name: 'Lanchonete Estação', taxId: null },
    paymentMethod: 'PIX',
    suggestedCategory: 'MEAL',
    currency: 'BRL',
    items: [
      { description: 'Café expresso', quantity: 1, unitPrice: 650, total: 650 },
      { description: 'Pão de queijo', quantity: 2, unitPrice: 550, total: 1100 },
    ],
    discount: 0,
    total: 1750,
    confidence: 0.97,
  },
];
