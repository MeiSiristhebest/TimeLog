-- 20260324_time_capsule.sql
-- Add unlock_at for the Time Capsule feature

-- Alter public.stories to add unlock_at
ALTER TABLE public.stories 
ADD COLUMN unlock_at BIGINT;

COMMENT ON COLUMN public.stories.unlock_at IS 'Unix timestamp in ms representing when the time capsule unlocks. Null means it is unlocked immediately.';
