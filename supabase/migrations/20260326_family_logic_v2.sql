-- Migration: Family Logic V2 (Bonding & Recovery)
-- Date: 2026-03-26

-- 1. Create bonding_requests table
CREATE TABLE IF NOT EXISTS public.bonding_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (requester_id, target_id)
);

-- Enable RLS
ALTER TABLE public.bonding_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Requesters can see their own requests"
    ON public.bonding_requests FOR SELECT
    USING (auth.uid() = requester_id);

CREATE POLICY "Targets can see requests sent to them"
    ON public.bonding_requests FOR SELECT
    USING (auth.uid() = target_id);

CREATE POLICY "Requesters can create requests"
    ON public.bonding_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Targets can update status of requests sent to them"
    ON public.bonding_requests FOR UPDATE
    USING (auth.uid() = target_id)
    WITH CHECK (auth.uid() = target_id);

-- 2. Function to respond to bonding request
CREATE OR REPLACE FUNCTION public.respond_to_bonding_request(
    p_request_id UUID,
    p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_requester_id UUID;
    v_target_id UUID;
BEGIN
    -- 1. Verify target is current user
    SELECT requester_id, target_id INTO v_requester_id, v_target_id
    FROM public.bonding_requests
    WHERE id = p_request_id AND target_id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or unauthorized';
    END IF;

    -- 2. Update status
    UPDATE public.bonding_requests
    SET status = p_status, updated_at = now()
    WHERE id = p_request_id;

    -- 3. If approved, create connection
    IF p_status = 'approved' THEN
        INSERT INTO public.family_connections (senior_id, member_id)
        VALUES (v_target_id, v_requester_id)
        ON CONFLICT (senior_id, member_id) DO NOTHING;
    END IF;
END;
$$;

-- 3. Function to generate recovery code by family
-- This generates a 6-digit numeric code for a linked senior
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
    v_expiry TIMESTAMPTZ;
BEGIN
    -- 1. Verify caller is a linked family member
    IF NOT EXISTS (
        SELECT 1 FROM public.family_connections
        WHERE senior_id = p_senior_id AND member_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not a linked family member';
    END IF;

    -- 2. Generate random 6-digit code
    v_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    v_expiry := now() + INTERVAL '24 hours';

    -- 3. Insert into recovery_codes table (assuming RCV-XXX-XXX format needed for alignment, but we use numeric for elderly)
    INSERT INTO public.recovery_codes (user_id, code, expires_at, is_active)
    VALUES (p_senior_id, 'REC-' || v_code, v_expiry, true);

    RETURN QUERY SELECT v_code, v_expiry;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.respond_to_bonding_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_senior_recovery_code(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.bonding_requests IS 'Handles family-to-senior connection approval lifecycle.';
COMMENT ON FUNCTION public.generate_senior_recovery_code IS 'Allows family members to generate a short-lived recovery code for their elderly relatives.';
