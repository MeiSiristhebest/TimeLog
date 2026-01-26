-- Supabase Migration: Story Comments
-- Story 4.3: Realtime Comment System
--
-- This migration creates the story_comments table for family users
-- to leave textual comments on senior's stories.

-- ============================================
-- Step 1: Create story_comments table
-- ============================================

CREATE TABLE IF NOT EXISTS story_comments
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    story_id UUID NOT NULL REFERENCES audio_recordings
(
    id
) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
)
  ON DELETE CASCADE,
    content TEXT NOT NULL CHECK
(
    char_length
(
    content
) > 0 AND char_length
(
    content
) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
)
    );

-- ============================================
-- Step 2: Create indexes for efficient queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_story_comments_story_id
    ON story_comments(story_id);

CREATE INDEX IF NOT EXISTS idx_story_comments_created_at
    ON story_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_story_comments_user_id
    ON story_comments(user_id);

-- ============================================
-- Step 3: Enable Row Level Security
-- ============================================

ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 4: RLS Policies
-- ============================================

-- Policy 1: Family members can read comments on linked senior's stories
-- Also allows users to read their own comments
CREATE
POLICY "family_read_comments" ON story_comments
FOR
SELECT USING (
    -- User can read their own comments
    auth.uid() = user_id
    OR
    -- Family can read comments on linked senior's stories
    story_id IN (
    SELECT ar.id FROM audio_recordings ar
    WHERE ar.user_id IN (
    SELECT senior_user_id FROM family_members
    WHERE family_user_id = auth.uid() AND status = 'active'
    )
    )
    OR
    -- Senior can read comments on their own stories
    story_id IN (
    SELECT id FROM audio_recordings
    WHERE user_id = auth.uid()
    )
    );

-- Policy 2: Family members can insert comments on linked senior's stories
CREATE
POLICY "family_insert_comments" ON story_comments
FOR INSERT WITH CHECK (
  -- Must be the authenticated user
  auth.uid() = user_id
  AND
  -- Story must belong to a linked senior
  story_id IN (
    SELECT ar.id FROM audio_recordings ar
    WHERE ar.user_id IN (
      SELECT senior_user_id FROM family_members
      WHERE family_user_id = auth.uid() AND status = 'active'
    )
  )
);

-- Policy 3: Users can update their own comments
CREATE
POLICY "users_update_own_comments" ON story_comments
FOR
UPDATE USING (
    auth.uid() = user_id
    )
WITH CHECK (
    auth.uid() = user_id
    );

-- Policy 4: Users can delete their own comments
CREATE
POLICY "users_delete_own_comments" ON story_comments
FOR DELETE
USING (
  auth.uid() = user_id
);

-- ============================================
-- Step 5: Enable Realtime for this table
-- ============================================

-- Note: Run this in Supabase Dashboard or via API:
-- ALTER PUBLICATION supabase_realtime ADD TABLE story_comments;

-- ============================================
-- Step 6: Create updated_at trigger
-- ============================================

CREATE
OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at
= NOW();
RETURN NEW;
END;
$$
language 'plpgsql';

CREATE TRIGGER update_story_comments_updated_at
    BEFORE UPDATE
    ON story_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries
-- ============================================

-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'story_comments';

-- Check RLS policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'story_comments';

-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'story_comments';
