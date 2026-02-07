import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export * from './localProfiles';
export * from './audioRecordings';
export * from './syncQueue';
export * from './activityEvents';
export * from './storyReactions';
export * from './familyQuestions';
export * from './transcriptSegments';
