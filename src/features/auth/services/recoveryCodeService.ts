/**
 * Recovery Code Service
 * 
 * Handles generation, retrieval, and validation of user recovery codes
 * for device restoration purposes.
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export type RecoveryCode = {
    id: string;
    userId: string;
    code: string;
    createdAt: string;
    expiresAt: string;
    isActive: boolean;
    revokedAt: string | null;
};

type RecoveryCodeRow = {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  revoked_at: string | null;
};

/**
 * Generate a new recovery code for the current user.
 * Auto-revokes any existing active codes.
 * 
 * @returns Newly generated recovery code
 * @throws Error if user not authenticated or generation fails
 */
export async function generateRecoveryCode(): Promise<RecoveryCode> {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        devLog.error('[recoveryCodeService] User not authenticated:', authError);
        throw new Error('You must be logged in to generate a recovery code');
    }

    // Generate unique code: RCV-XXX-XXX format
    const code = generateCodeFormat();

    // Insert new code (trigger will auto-revoke old ones)
    const { data, error } = await supabase
        .from('recovery_codes')
        .insert({
            user_id: user.id,
            code: code,
        })
        .select()
        .single();

    if (error) {
        devLog.error('[recoveryCodeService] Failed to generate code:', error);
        throw new Error('Failed to generate recovery code. Please try again.');
    }

    return mapToRecoveryCode(data);
}

/**
 * Get the active recovery code for the current user.
 * 
 * @returns Active recovery code or null if none exists
 * @throws Error if user not authenticated
 */
export async function getActiveRecoveryCode(): Promise<RecoveryCode | null> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        devLog.error('[recoveryCodeService] User not authenticated:', authError);
        throw new Error('You must be logged in');
    }

    const { data, error } = await supabase
        .from('recovery_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error) {
        // No active code is not an error
        if (error.code === 'PGRST116') {
            return null;
        }
        devLog.error('[recoveryCodeService] Failed to fetch active code:', error);
        throw new Error('Failed to retrieve recovery code');
    }

    return mapToRecoveryCode(data);
}

/**
 * Manually revoke an active recovery code.
 * 
 * @param codeId - UUID of the code to revoke
 * @throws Error if revocation fails
 */
export async function revokeRecoveryCode(codeId: string): Promise<void> {
    const { error } = await supabase
        .from('recovery_codes')
        .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
        })
        .eq('id', codeId);

    if (error) {
        devLog.error('[recoveryCodeService] Failed to revoke code:', error);
        throw new Error('Failed to revoke recovery code');
    }
}

/**
 * Validate a recovery code.
 * Uses database function for security.
 * 
 * @param code - Recovery code to validate
 * @returns Validation result with user_id if valid
 */
export async function validateRecoveryCode(code: string): Promise<{
    isValid: boolean;
    userId: string | null;
    expiresAt: string | null;
}> {
    const { data, error } = await supabase.rpc('validate_recovery_code', {
        p_code: code,
    });

    if (error) {
        devLog.error('[recoveryCodeService] Validation failed:', error);
        return { isValid: false, userId: null, expiresAt: null };
    }

    const result = data?.[0];
    return {
        isValid: result?.is_valid ?? false,
        userId: result?.user_id ?? null,
        expiresAt: result?.expires_at ?? null,
    };
}

// Helper: Generate recovery code in RCV-XXX-XXX format
function generateCodeFormat(): string {
    const part1 = Math.floor(100 + Math.random() * 900); // 100-999
    const part2 = Math.floor(100 + Math.random() * 900); // 100-999
    return `RCV-${part1}-${part2}`;
}

// Helper: Map database row to RecoveryCode type
function mapToRecoveryCode(data: RecoveryCodeRow): RecoveryCode {
    return {
        id: data.id,
        userId: data.user_id,
        code: data.code,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
        isActive: data.is_active,
        revokedAt: data.revoked_at,
    };
}
