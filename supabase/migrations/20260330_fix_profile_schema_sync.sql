-- Migration: Comprehensive Profile & Auth Sync v2.1 (Hardened)
-- Purpose: Final resolution for 'Upgrade Account' banner, sync identifiers, and fix RPC conflicts.
-- Date: 2026-03-30
-- Author: Antigravity

-- 1. Profiles Table: Force alignment of identity columns and defaults
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT true, -- Default to true for new app starts
ADD COLUMN IF NOT EXISTS upgraded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Data Migration: Cleanup of 'Legacy' Guest markers
-- If a profile has an email (authenticated), it CANNOT be anonymous.
UPDATE public.profiles 
SET is_anonymous = false,
    upgraded_at = COALESCE(upgraded_at, now())
WHERE email IS NOT NULL OR id IN (SELECT id FROM auth.users WHERE is_anonymous = false);

-- Sync names if missing
UPDATE public.profiles SET display_name = full_name WHERE display_name IS NULL AND full_name IS NOT NULL;
UPDATE public.profiles SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;

-- 3. Recovery Codes: Expiry Alignment
ALTER TABLE public.recovery_codes 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '365 days');

-- 4. RPC Fix: DROP functions explicitly before recreation to avoid Parameter Type Mismatch (42P13)
-- This is critical for functions returning TABLE/OUT parameters
DROP FUNCTION IF EXISTS public.get_family_members();
DROP FUNCTION IF EXISTS public.generate_senior_recovery_code(UUID);

-- 5. Recreate Functions with correct signatures
-- [Get Family Members]
CREATE OR REPLACE FUNCTION public.get_family_members()
RETURNS TABLE (
    user_id uuid,
    display_name text,
    email text,
    avatar_url text,
    role text,
    linked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id AS user_id,
           COALESCE(p.display_name, p.full_name, 'Unknown Member') AS display_name,
           p.email::text AS email, 
           p.avatar_url,
           'member'::text AS role, 
           fc.created_at AS linked_at
    FROM public.family_connections fc
    JOIN public.profiles p ON p.id = fc.member_id
    WHERE fc.senior_id = auth.uid();
END;
$$;

-- [Generate Recovery Code]
CREATE OR REPLACE FUNCTION public.generate_senior_recovery_code(
    p_senior_id UUID
)
RETURNS TABLE (
    display_code TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_full_code TEXT;
    v_expiry TIMESTAMPTZ;
BEGIN
    -- Verify caller is a linked family member
    IF NOT EXISTS (
        SELECT 1 FROM public.family_connections
        WHERE senior_id = p_senior_id AND member_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a linked family member';
    END IF;

    v_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    v_full_code := 'REC-' || v_code;
    v_expiry := now() + INTERVAL '24 hours';

    INSERT INTO public.recovery_codes (user_id, code, expires_at, is_active)
    VALUES (p_senior_id, v_full_code, v_expiry, true);

    RETURN QUERY SELECT v_full_code, v_expiry;
END;
$$;

-- 6. Permissions
GRANT EXECUTE ON FUNCTION public.get_family_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_senior_recovery_code(UUID) TO authenticated;

-- Final Cleanup of existing markers to be ultra-safe
UPDATE public.profiles SET is_anonymous = false WHERE email IS NOT NULL;
