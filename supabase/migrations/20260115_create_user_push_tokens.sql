-- Migration: Create user_push_tokens table for push notification management
-- Story 4.4: Push Notification & Deep Link (AC: 1)
-- Date: 2026-01-15

-- Create user_push_tokens table
CREATE TABLE IF NOT EXISTS user_push_tokens
(
    id
    UUID
    PRIMARY
    KEY
    DEFAULT
    gen_random_uuid
(
),
    user_id UUID NOT NULL REFERENCES auth.users
(
    id
) ON DELETE CASCADE,
    push_token TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK
(
    device_type
    IN
(
    'ios',
    'android'
)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW
(
),
    UNIQUE
(
    user_id,
    push_token
)
    );

-- Index for efficient lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);

-- Enable Row Level Security
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own tokens
-- This allows INSERT, UPDATE, DELETE, and SELECT on own tokens only
CREATE
POLICY "users_manage_own_tokens" ON user_push_tokens
FOR ALL USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE
OR REPLACE FUNCTION update_user_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at
= NOW();
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS trigger_update_user_push_tokens_updated_at ON user_push_tokens;
CREATE TRIGGER trigger_update_user_push_tokens_updated_at
    BEFORE UPDATE
    ON user_push_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_user_push_tokens_updated_at();

-- Grant service role access for Edge Functions to query tokens
-- Edge Functions use service role key to look up recipient tokens
COMMENT
ON TABLE user_push_tokens IS 'Stores Expo push tokens for users to receive push notifications';
