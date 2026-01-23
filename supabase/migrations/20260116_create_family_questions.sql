-- Create family_questions table
CREATE TABLE family_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_user_id UUID NOT NULL REFERENCES auth.users(id),
  family_user_id UUID NOT NULL REFERENCES auth.users(id),
  question_text TEXT NOT NULL,
  recording_id UUID REFERENCES audio_recordings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- Index for efficient querying of unanswered questions
CREATE INDEX family_questions_senior_unanswered_idx 
  ON family_questions(senior_user_id, answered_at) 
  WHERE answered_at IS NULL;

-- Enable Row Level Security
ALTER TABLE family_questions ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Family members can insert questions (for anyone, but practically validated by app logic)
CREATE POLICY "users_can_create_questions"
  ON family_questions FOR INSERT
  WITH CHECK (auth.uid() = family_user_id);

-- 2. Senior users can view questions addressed to them
CREATE POLICY "seniors_view_own_questions"
  ON family_questions FOR SELECT
  USING (auth.uid() = senior_user_id OR auth.uid() = family_user_id);

-- 3. Senior users can update (mark as answered)
CREATE POLICY "seniors_update_own_questions"
  ON family_questions FOR UPDATE
  USING (auth.uid() = senior_user_id);
