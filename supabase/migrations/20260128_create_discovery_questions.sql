-- Migration: Create discovery_questions table
-- Purpose: Dynamic question library for Discovery feature
-- Date: 2026-01-28

-- Create discovery_questions table
CREATE TABLE IF NOT EXISTS discovery_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovery_category ON discovery_questions(category);
CREATE INDEX IF NOT EXISTS idx_discovery_priority ON discovery_questions(priority DESC);

-- Enable RLS
ALTER TABLE discovery_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read discovery questions (public content)
CREATE POLICY "Anyone can read discovery questions"
  ON discovery_questions FOR SELECT
  USING (true);

-- Only authenticated users with specific role can insert/update
-- (This would typically be an admin role, but for now we allow all authenticated users)
CREATE POLICY "Authenticated users can manage discovery questions"
  ON discovery_questions FOR ALL
  USING (auth.role() = 'authenticated');

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_discovery_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_discovery_questions_updated_at
  BEFORE UPDATE ON discovery_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_questions_updated_at();

-- Import initial questions from topicQuestions.ts
INSERT INTO discovery_questions (question_text, category, priority) VALUES
  ('What was your favorite game as a child?', 'childhood', 100),
  ('Do you remember your first day of school?', 'childhood', 95),
  ('What was your childhood home like?', 'childhood', 90),
  ('Who was your best friend when you were young?', 'memories', 85),
  ('What is your proudest achievement in life?', 'memories', 80),
  ('What was your most memorable trip?', 'memories', 75),
  ('How did you meet your spouse?', 'family', 100),
  ('What is your favorite holiday and why?', 'family', 85),
  ('What was your dream when you were young?', 'career', 90),
  ('What was your first job?', 'career', 85),
  ('What is the most important lesson your parents taught you?', 'wisdom', 100),
  ('What do you want your descendants to remember about you?', 'wisdom', 95),
  ('What was the biggest challenge you faced in life?', 'wisdom', 90),
  ('What advice would you share with your children or grandchildren?', 'wisdom', 85),
  ('What is your favorite food? Any special story behind it?', 'memories', 70)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE discovery_questions IS 'Dynamic question library for Discovery feature. Questions are shown to users to inspire story recordings.';
