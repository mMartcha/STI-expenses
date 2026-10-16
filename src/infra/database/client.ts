import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'ocr-stara.db';

/**
 * Conexão única do app. WAL melhora a concorrência leitura/escrita e foreign_keys
 * garante o cascade dos itens. Para produção, avaliar SQLCipher (`useSQLCipher` no
 * plugin do expo-sqlite) com a chave guardada no SecureStore — exige dev build.
 */
export const sqlite = openDatabaseSync(DATABASE_NAME);
sqlite.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export type Database = typeof db;
