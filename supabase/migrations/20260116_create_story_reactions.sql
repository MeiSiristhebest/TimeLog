-- Story Reactions Table for Quick Reactions Feature (Post-MVP)
-- Stores heart/like reactions from family members on stories

CREATE TABLE story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES audio_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'heart',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate reactions: one reaction per user per story per type
  UNIQUE(story_id, user_id, reaction_type)
);

-- Index for efficient lookups by story
CREATE INDEX idx_story_reactions_story_id ON story_reactions(story_id);

-- Index for efficient lookups by user
CREATE INDEX idx_story_reactions_user_id ON story_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Family members can add reactions to stories they can access
-- Family members can view stories of seniors they are connected to
CREATE POLICY "family_can_react"
  ON story_reactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM audio_recordings ar
      JOIN family_members fm ON fm.senior_user_id = ar.user_id
      WHERE ar.id = story_id AND fm.family_user_id = auth.uid()
    )
  );

-- Policy: Users can see reactions on stories they have access to
-- This includes: their own stories (as senior) or stories from seniors they follow (as family)
CREATE POLICY "users_can_view_reactions"
  ON story_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM audio_recordings ar
      WHERE ar.id = story_id
      AND (
        -- Senior can see reactions on their own stories
        ar.user_id = auth.uid()
        OR
        -- Family can see reactions on stories from their connected seniors
        EXISTS (
          SELECT 1 FROM family_members fm
          WHERE fm.senior_user_id = ar.user_id AND fm.family_user_id = auth.uid()
        )
      )
    )
  );

-- Policy: Users can only delete their own reactions
CREATE POLICY "users_can_delete_own_reactions"
  ON story_reactions FOR DELETE
  USING (user_id = auth.uid());
