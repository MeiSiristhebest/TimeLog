-- Migration: Fix profiles table and create missing tables
-- Date: 2026-01-28
-- Description: Fixes schema mismatches identified in global audit

-- =============================================================================
-- 1. FIX PROFILES TABLE
-- =============================================================================

-- Add missing columns to profiles table
-- Note: Supabase has 'full_name', code expects 'display_name'
-- We'll add 'display_name' as an alias column and keep 'full_name' for compatibility

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name text;

-- Copy existing full_name values to display_name
UPDATE public.profiles
SET display_name = full_name
WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Add role column (storyteller or family)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('storyteller', 'family'));

-- Add bio column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text;

-- Add updated_at column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 2. CREATE USER_PUSH_TOKENS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    push_token text NOT NULL,
    device_type text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, push_token)
);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own push tokens"
    ON public.user_push_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id
    ON public.user_push_tokens(user_id);

-- =============================================================================
-- 3. CREATE USER_SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    cloud_ai_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own settings"
    ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. GRANT PERMISSIONS
-- =============================================================================

GRANT ALL ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_settings TO authenticated;
