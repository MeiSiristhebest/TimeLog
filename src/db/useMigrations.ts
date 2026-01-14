import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './client';
import migrations from '../../drizzle/migrations';

export const useDbMigrations = () => {
    return useMigrations(db, migrations);
};
