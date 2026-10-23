import { CaptureReceiptBatchUseCase, RECEIPT_BATCH_LIMIT } from '@/domain/usecases/expense/CaptureReceiptBatchUseCase';
import { CaptureReceiptUseCase, type CaptureReceiptInput } from '@/domain/usecases/expense/CaptureReceiptUseCase';

import {
  FakeReceiptStorage,
  FakeScheduler,
  FakeSessionRepository,
  FixedClock,
  InMemoryExpenseRepository,
  InMemorySyncQueue,
  SequentialIds,
} from '../../helpers/fakes';

function setup() {
  const clock = new FixedClock();
  const ids = new SequentialIds();
  const expenses = new InMemoryExpenseRepository();
  const queue = new InMemorySyncQueue(clock);
  const scheduler = new FakeScheduler();
  const sessions = new FakeSessionRepository();
  const receipts = new FakeReceiptStorage();
  const capture = new CaptureReceiptUseCase(expenses, receipts, queue, scheduler, sessions, clock, ids);
  return { expenses, queue, receipts, sessions, capture, batch: new CaptureReceiptBatchUseCase(capture) };
}

const photo = (name: string): CaptureReceiptInput => ({ kind: 'file', sourceUri: `file:///tmp/${name}`, mimeType: 'image/jpeg' });

describe('CaptureReceiptBatchUseCase', () => {
  it('cria uma despesa por comprovante, na ordem da captura, todas aguardando leitura', async () => {
    const { batch, expenses, queue } = setup();

    const result = await batch.execute([photo('a.jpg'), photo('b.jpg'), photo('c.jpg')]);

    expect(result.failed).toEqual([]);
    expect(result.created.map((e) => e.receipt?.localUri)).toEqual([
      'file:///receipts/a.jpg',
      'file:///receipts/b.jpg',
      'file:///receipts/c.jpg',
    ]);
    expect(result.created.every((e) => e.ocrStatus === 'PENDING')).toBe(true);
    expect(expenses.items.size).toBe(3);
    expect(queue.ops.filter((op) => op.type === 'RECEIPT_OCR')).toHaveLength(3);
  });

  it('um comprovante inválido não impede os demais', async () => {
    const { batch, receipts, expenses } = setup();
    const persist = receipts.persist.bind(receipts);
    receipts.persist = async (uri, mime) => {
      if (uri.endsWith('ruim.jpg')) throw new Error('Formato de arquivo não suportado');
      return persist(uri, mime);
    };

    const result = await batch.execute([photo('a.jpg'), photo('ruim.jpg'), photo('c.jpg')]);

    expect(result.created).toHaveLength(2);
    expect(result.failed.map((f) => f.index)).toEqual([1]);
    expect(expenses.items.size).toBe(2);
  });

  it('lança o erro quando nenhum comprovante pôde ser registrado', async () => {
    const { batch, sessions } = setup();
    sessions.session = null;
    await expect(batch.execute([photo('a.jpg'), photo('b.jpg')])).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('rejeita lote vazio e lote acima do limite', async () => {
    const { batch } = setup();
    await expect(batch.execute([])).rejects.toMatchObject({ code: 'VALIDATION' });
    const tooMany = Array.from({ length: RECEIPT_BATCH_LIMIT + 1 }, (_, i) => photo(`${i}.jpg`));
    await expect(batch.execute(tooMany)).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('CaptureReceiptUseCase (falha ao enfileirar)', () => {
  it('desfaz a despesa e apaga a cópia do comprovante', async () => {
    const { capture, queue, expenses, receipts } = setup();
    queue.enqueue = async () => {
      throw new Error('disco cheio');
    };

    await expect(capture.execute(photo('a.jpg'))).rejects.toThrow('disco cheio');
    expect(expenses.items.size).toBe(0);
    expect(receipts.removed).toEqual(['file:///receipts/a.jpg']);
  });
});
