import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './client';
import migrations from '../../drizzle/migrations';

export function useDbMigrations(): ReturnType<typeof useMigrations> {
  return useMigrations(db, migrations);
}
