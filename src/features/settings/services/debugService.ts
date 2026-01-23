/**
 * Debug Service for Settings
 *
 * Handles database queries and debug operations for the settings page.
 * Follows Architecture Mandate: ALL external calls MUST be in services/*.ts
 */

import { db } from '@/db/client';
import { audioRecordings } from '@/db/schema';
import { count } from 'drizzle-orm';

/**
 * Get total count of local audio recordings in the database.
 * Used for debugging/verification in settings.
 */
export async function getLocalRecordingsCount(): Promise<number> {
  const result = await db.select({ count: count() }).from(audioRecordings);
  return result[0]?.count ?? 0;
}
