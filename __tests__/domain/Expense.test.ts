import { DomainError, ValidationError } from '@/core/errors';
import { Expense } from '@/domain/entities/Expense';

import { ctx, FixedClock, sampleOcr, SequentialIds } from '../helpers/fakes';

function receiptExpense() {
  const clock = new FixedClock();
  const ids = new SequentialIds();
  const expense = Expense.createFromReceipt(
    { ownerId: 'user-1', receipt: { localUri: 'file:///r.jpg', mimeType: 'image/jpeg' }, currency: 'BRL' },
    ctx('user-1', clock, ids),
  );
  return { expense: expense.applyOcrResult(sampleOcr(), ctx('system:ocr', clock, ids)), clock, ids };
}

describe('Expense', () => {
  describe('OCR', () => {
    it('preenche itens, estabelecimento, categoria e total a partir da leitura', () => {
      const { expense } = receiptExpense();
      expect(expense.ocrStatus).toBe('DONE');
      expect(expense.items).toHaveLength(3);
      expect(expense.merchant?.name).toBe('Restaurante Sabor Gaúcho');
      expect(expense.category).toBe('MEAL');
      expect(expense.total.amount).toBe(9090);
      expect(expense.ocrSnapshot?.total).toBe(9090);
    });

    it('mantém os dados manuais quando o usuário preencheu antes do OCR terminar', () => {
      const clock = new FixedClock();
      const ids = new SequentialIds();
      const pending = Expense.createFromReceipt(
        { ownerId: 'user-1', receipt: { localUri: 'file:///r.jpg', mimeType: 'image/jpeg' }, currency: 'BRL' },
        ctx('user-1', clock, ids),
      ).addItem({ description: 'Almoço', quantity: 1, unitPrice: 4500 }, ctx('user-1', clock, ids));

      const result = pending.applyOcrResult(sampleOcr(), ctx('system:ocr', clock, ids));
      expect(result.items).toHaveLength(1);
      expect(result.total.amount).toBe(4500);
      expect(result.ocrSnapshot).not.toBeNull();
      expect(result.history.at(-1)?.reason).toBe('MANUAL_DATA_KEPT');
    });
  });

  describe('remover item da nota', () => {
    it('recalcula o total e registra o item, o motivo e o valor anterior no histórico', () => {
      const { expense, clock, ids } = receiptExpense();
      const beer = expense.items.find((item) => item.description.startsWith('Cerveja'))!;

      const updated = expense.removeItem(beer.id, 'Bebida alcoólica', ctx('user-1', clock, ids));

      expect(updated.total.amount).toBe(9090 - 2400);
      expect(updated.excludedAmount.amount).toBe(2400);
      expect(updated.removedItems.map((item) => item.id)).toEqual([beer.id]);
      expect(updated.items).toHaveLength(3); // nada é apagado: o gestor vê o item removido

      const entry = updated.history.at(-1)!;
      expect(entry).toMatchObject({ action: 'ITEM_REMOVED', actorId: 'user-1', targetId: beer.id, reason: 'Bebida alcoólica' });
      expect(entry.changes).toEqual([{ field: 'total', from: 9090, to: 6690 }]);
    });

    it('restaurar o item volta ao valor original', () => {
      const { expense, clock, ids } = receiptExpense();
      const item = expense.items[2];
      const restored = expense.removeItem(item.id, null, ctx('user-1', clock, ids)).restoreItem(item.id, ctx('user-1', clock, ids));
      expect(restored.total.amount).toBe(9090);
      expect(restored.history.at(-1)?.action).toBe('ITEM_RESTORED');
    });

    it('aplica o desconto da nota de forma proporcional aos itens mantidos', () => {
      const clock = new FixedClock();
      const ids = new SequentialIds();
      const expense = Expense.createFromReceipt(
        { ownerId: 'user-1', receipt: { localUri: 'file:///r.jpg', mimeType: 'image/jpeg' }, currency: 'BRL' },
        ctx('user-1', clock, ids),
      ).applyOcrResult(
        sampleOcr({
          items: [
            { description: 'A', quantity: 1, unitPrice: 5000, total: 5000 },
            { description: 'B', quantity: 1, unitPrice: 5000, total: 5000 },
          ],
          discount: 1000,
          total: 9000,
        }),
        ctx('system:ocr', clock, ids),
      );
      expect(expense.total.amount).toBe(9000);

      const updated = expense.removeItem(expense.items[1].id, null, ctx('user-1', clock, ids));
      expect(updated.effectiveDiscount.amount).toBe(500);
      expect(updated.total.amount).toBe(4500);
      expect(updated.excludedAmount.amount).toBe(4500);
    });
  });

  describe('editar item', () => {
    it('recalcula o total do item ao corrigir quantidade/preço e registra de → para', () => {
      const { expense, clock, ids } = receiptExpense();
      const item = expense.items[0];
      const updated = expense.updateItem(item.id, { unitPrice: 4990 }, ctx('user-1', clock, ids));

      expect(updated.findItem(item.id).total.amount).toBe(4990);
      expect(updated.total.amount).toBe(9090 - 1000);
      expect(updated.history.at(-1)?.changes).toEqual(
        expect.arrayContaining([
          { field: 'unitPrice', from: 5990, to: 4990 },
          { field: 'total', from: 5990, to: 4990 },
        ]),
      );
    });

    it('não gera histórico quando nada mudou', () => {
      const { expense, clock, ids } = receiptExpense();
      const same = expense.updateItem(expense.items[0].id, { description: 'Buffet livre' }, ctx('user-1', clock, ids));
      expect(same).toBe(expense);
    });

    it('incrementa a versão a cada alteração (concorrência otimista)', () => {
      const { expense, clock, ids } = receiptExpense();
      const updated = expense.updateItem(expense.items[0].id, { quantity: 2 }, ctx('user-1', clock, ids));
      expect(updated.version).toBe(expense.version + 1);
      expect(updated.syncStatus).toBe('PENDING');
    });
  });

  describe('regras', () => {
    it('bloqueia qualquer alteração depois de aprovada', () => {
      const { expense, clock, ids } = receiptExpense();
      const locked = expense.lock();
      expect(() => locked.removeItem(expense.items[0].id, null, ctx('user-1', clock, ids))).toThrow(
        expect.objectContaining({ code: 'LOCKED' }),
      );
      expect(() => locked.updateDetails({ notes: 'x' }, ctx('user-1', clock, ids))).toThrow(DomainError);
    });

    it('não permite desconto maior que o valor dos itens', () => {
      const { expense, clock, ids } = receiptExpense();
      expect(() => expense.updateDetails({ discount: 100_000 }, ctx('user-1', clock, ids))).toThrow(ValidationError);
    });

    it('cria despesa manual (sem nota) com um item e valida o valor', () => {
      const expense = Expense.createManual(
        { ownerId: 'user-1', description: 'Táxi', amount: 4500, category: 'TRANSPORT', occurredAt: '2026-10-15T10:00:00Z', currency: 'BRL' },
        ctx(),
      );
      expect(expense.total.amount).toBe(4500);
      expect(expense.ocrStatus).toBe('NOT_REQUESTED');
      expect(() =>
        Expense.createManual(
          { ownerId: 'user-1', description: 'Táxi', amount: -1, category: 'TRANSPORT', occurredAt: '2026-10-15T10:00:00Z', currency: 'BRL' },
          ctx(),
        ),
      ).toThrow(ValidationError);
    });

    it('normaliza e valida o CNPJ', () => {
      const { expense, clock, ids } = receiptExpense();
      const updated = expense.updateDetails({ merchantTaxId: '12.345.678/0001-90' }, ctx('user-1', clock, ids));
      expect(updated.merchant?.taxId).toBe('12345678000190');
      expect(() => expense.updateDetails({ merchantTaxId: '123' }, ctx('user-1', clock, ids))).toThrow(ValidationError);
    });
  });
});
