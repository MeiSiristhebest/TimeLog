import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type LocalProfileRole = 'storyteller' | 'family';

// Local-first profile snapshot. Source of truth for anonymous users.
export const localProfiles = sqliteTable('local_profiles', {
  id: text('id').primaryKey(),
  displayName: text('display_name'),
  birthDate: text('birth_date'), // ISO-8601 date string
  language: text('language'), // BCP-47 language tag
  fontScaleIndex: integer('font_scale_index'),
  avatarUri: text('avatar_uri'),
  avatarUrl: text('avatar_url'),
  role: text('role').$type<LocalProfileRole>().default('storyteller'),
  isAnonymous: integer('is_anonymous', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(), // epoch ms
  updatedAt: integer('updated_at').notNull(), // epoch ms
});
