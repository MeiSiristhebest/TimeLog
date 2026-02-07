import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Single source of truth for SQLite access.
const sqlite = SQLite.openDatabaseSync('timelog.db', {
  enableChangeListener: true,
});

export const db = drizzle(sqlite, { schema });
export type Database = typeof db;
