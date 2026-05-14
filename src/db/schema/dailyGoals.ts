import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// One row per local calendar day per user. Keeps habit progress local-first.
export const dailyGoals = sqliteTable('daily_goals', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  dateKey: text('date_key').notNull(), // yyyy-MM-dd in the device's local timezone
  goalDurationMs: integer('goal_duration_ms').notNull(),
  completedDurationMs: integer('completed_duration_ms').notNull().default(0),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
