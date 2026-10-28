import type { LocalDataStore } from '@/domain/gateways/LocalDataStore';
import { ClearLocalDataUseCase } from '@/domain/usecases/sync/ClearLocalDataUseCase';

import { FixedClock, InMemorySyncQueue } from '../../helpers/fakes';

class FakeLocalDataStore implements LocalDataStore {
  wipes = 0;
  async wipe() {
    this.wipes += 1;
  }
}

function setup() {
  const queue = new InMemorySyncQueue(new FixedClock());
  const localData = new FakeLocalDataStore();
  return { queue, localData, clear: new ClearLocalDataUseCase(queue, localData) };
}

describe('ClearLocalDataUseCase', () => {
  it('apaga os dados locais quando não há nada pendente de envio', async () => {
    const { localData, clear } = setup();
    await clear.execute();
    expect(localData.wipes).toBe(1);
  });

  it('não apaga com envios pendentes, a menos que seja forçado', async () => {
    const { queue, localData, clear } = setup();
    await queue.enqueue({ type: 'EXPENSE_UPSERT', entityId: 'e1' });

    await expect(clear.execute()).rejects.toMatchObject({ code: 'PENDING_SYNC', details: { count: 1 } });
    expect(localData.wipes).toBe(0);

    await clear.execute({ force: true });
    expect(localData.wipes).toBe(1);
  });
});
