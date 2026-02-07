-- Migration: Add category field to family_questions table
-- Feature: F3.2 Category Filter for Topic Library
-- Date: 2026-01-29
-- Version: 20260129_add_question_categories

-- Add category column with default value
ALTER TABLE family_questions 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general';

-- Create index for efficient category filtering
CREATE INDEX IF NOT EXISTS family_questions_category_idx 
ON family_questions(category);

-- Backfill existing data with default category
-- (All existing questions will be categorized as 'general')
UPDATE family_questions 
SET category = 'general' 
WHERE category IS NULL OR category = '';

-- Add check constraint to ensure valid categories
ALTER TABLE family_questions
ADD CONSTRAINT family_questions_category_check 
CHECK (category IN ('childhood', 'family', 'career', 'hobbies', 'travel', 'general'));

-- Comments for documentation
COMMENT ON COLUMN family_questions.category IS 
'Question category for Topic Library filtering. Valid values: childhood, family, career, hobbies, travel, general';

COMMENT ON INDEX family_questions_category_idx IS 
'Index for efficient category-based filtering in Topic Discovery feature (F3.2)';
