import { eq } from 'drizzle-orm';

import type { PreferencesRepository } from '@/domain/repositories/PreferencesRepository';

import type { Database } from '../database/client';
import { preferences } from '../database/schema';

export class DrizzlePreferencesRepository implements PreferencesRepository {
  constructor(private readonly db: Database) {}

  async get(key: string): Promise<string | null> {
    return this.db.select().from(preferences).where(eq(preferences.key, key)).get()?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.db.insert(preferences).values({ key, value }).onConflictDoUpdate({ target: preferences.key, set: { value } }).run();
  }
}
