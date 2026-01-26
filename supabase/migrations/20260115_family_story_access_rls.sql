-- Supabase RLS Policies for Family Story Access
-- Story 4.1: Family Story List (AC: 4)
--
-- These policies ensure data isolation between families.
-- Family users can only see stories from their linked senior.
--
-- Prerequisites:
-- 1. `family_members` table must exist with:
--    - senior_user_id (UUID): The elderly user's ID
--    - family_user_id (UUID): The family member's ID
--    - status (TEXT): 'active' | 'pending' | 'revoked'
--
-- 2. `audio_recordings` table must have:
--    - user_id (UUID): Owner's ID (senior)
--    - sync_status (TEXT): 'local' | 'queued' | 'syncing' | 'synced' | 'failed'
--    - deleted_at (TIMESTAMP): Soft delete timestamp

-- ============================================
-- Policy 1: Senior users can manage their own recordings
-- ============================================
-- This policy allows senior users full access to their own recordings.

CREATE
POLICY "users_can_manage_own_recordings" ON audio_recordings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Policy 2: Family users can view linked senior's synced stories
-- ============================================
-- This policy allows family members to SELECT stories from their linked senior.
-- Only synced (uploaded) stories are visible to family.
-- Deleted stories are excluded.

CREATE
POLICY "family_can_view_linked_senior_stories" ON audio_recordings
  FOR
SELECT
    USING (
    -- Story must be synced to cloud
    sync_status = 'synced'
    AND
    -- Story must not be deleted
    deleted_at IS NULL
    AND
    -- Current user must be an active family member linked to this senior
    user_id IN (
    SELECT senior_user_id
    FROM family_members
    WHERE family_user_id = auth.uid()
    AND status = 'active'
    )
    );

-- ============================================
-- Alternative: Combined policy using OR logic
-- ============================================
-- If you prefer a single policy for both owner and family access:
--
-- CREATE POLICY "owner_or_family_can_view_recordings" ON audio_recordings
--   FOR SELECT
--   USING (
--     -- Owner can see all their recordings
--     auth.uid() = user_id
--     OR
--     -- Family can see synced, non-deleted recordings
--     (
--       sync_status = 'synced'
--       AND deleted_at IS NULL
--       AND user_id IN (
--         SELECT senior_user_id
--         FROM family_members
--         WHERE family_user_id = auth.uid()
--           AND status = 'active'
--       )
--     )
--   );

-- ============================================
-- Required: Enable RLS on the table
-- ============================================
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Testing Queries
-- ============================================
-- Test as senior user (should see all own recordings):
-- SELECT * FROM audio_recordings WHERE user_id = auth.uid();

-- Test as family user (should only see synced stories from linked senior):
-- SELECT * FROM audio_recordings;
-- Result should only include synced stories from linked senior

-- ============================================
-- Dashboard Configuration (Alternative to SQL)
-- ============================================
-- If you prefer using Supabase Dashboard:
--
-- 1. Go to Authentication > Policies
-- 2. Select `audio_recordings` table
-- 3. Add new policy:
--    - Name: family_can_view_linked_senior_stories
--    - Target roles: authenticated
--    - Policy command: SELECT
--    - USING expression: (paste the USING clause from above)
