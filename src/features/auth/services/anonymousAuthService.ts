/**
 * Anonymous Authentication Service
 * 
 * Handles anonymous authentication for storytellers who need immediate
 * access without registration. Supports account upgrade to permanent accounts.
 */
/**
 * Anonymous Authentication Service
 * 
 * Handles anonymous authentication for storytellers who need immediate
 * access without registration. Supports account upgrade to permanent accounts.
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import { getLocalProfile, updateLocalProfile } from '@/features/settings/services/localProfileService';
import { updateProfile } from '@/features/settings/services/profileService';

export type AnonymousAuthResult = {
    userId: string;
    isAnonymous: boolean;
    session: any;
};

/**
 * Utility to map Supabase Auth errors to user-friendly messages.
 */
export function mapAuthError(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const message = error.message || '';

  if (message.includes('New password should be different')) {
    return 'Your new password must be different from your temporary password.';
  }
  if (message.includes('Unable to validate email address: invalid format')) {
    return 'The email address format is not valid. Please check and try again.';
  }
  if (message.includes('User already exists')) {
    return 'This email address is already registered to another account.';
  }
  if (message.includes('Password should be at least 6 characters')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('Email address not allowed')) {
    return 'This email domain is not allowed for registration.';
  }

  return message;
}

/**
 * Sign in anonymously for storytellers.
 * Creates a temporary account that can be upgraded later by family members.
 * 
 * @returns User ID and session information
 * @throws Error if anonymous sign-in fails
 */
export async function signInAnonymously(): Promise<AnonymousAuthResult> {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
        devLog.error('[anonymousAuthService] Anonymous sign-in failed:', error);
        throw new Error('Failed to create anonymous session. Please try again.');
    }

    if (!data.user) {
        throw new Error('No user data returned from anonymous sign-in');
    }

    devLog.info('[anonymousAuthService] Anonymous user created:', data.user.id);

    // Create profile for anonymous user
    await createAnonymousProfile(data.user.id);

    return {
        userId: data.user.id,
        isAnonymous: data.user.is_anonymous || false,
        session: data.session,
    };
}

/**
 * Create profile entry for anonymous user.
 * Marks profile as anonymous for tracking.
 * 
 * @param userId - Anonymous user ID
 */
async function createAnonymousProfile(userId: string): Promise<void> {
    try {
        const { error } = await supabase.from('profiles').insert({
            id: userId,
            display_name: 'Storyteller', // Default name
            is_anonymous: true,
            created_at: new Date().toISOString(),
        });

        if (error) {
            // Ignore unique constraint violations (23505) - strict equality check
            // Ignore RLS policy violations (42501) - likely handled by trigger or exists
            if (error.code === '23505' || error.code === '42501') {
                devLog.info('[anonymousAuthService] Profile already exists/handled by trigger (safe to ignore)');
                return;
            }
            throw error;
        }
    } catch (e) {
        // Log but don't fail auth flow - profile might be optional or auto-created
        devLog.warn('[anonymousAuthService] Profile creation warning:', e);
    }
}

/**
 * Upgrade anonymous account to permanent account.
 * Called by family member after accepting device code.
 * Automatically generates a recovery code for backup login.
 * 
 * @param email - Email for the account
 * @param password - Password for the account
 * @param displayName - Optional display name
 * @returns Recovery code for the upgraded account
 * @throws Error if upgrade fails
 */
export async function upgradeAnonymousAccount(
  email: string,
  password: string,
  displayName?: string
): Promise<{ recoveryCode: string }> {
    // Get current user
    const {
        data: authData,
        error: userError,
    } = await supabase.auth.getUser();
    const user = authData?.user;

    if (userError || !user) {
        throw new Error('No user session found');
    }

    if (!user.is_anonymous) {
        throw new Error('User is not anonymous');
    }

    devLog.info('[anonymousAuthService] Upgrading anonymous account:', user.id);

    // Update user credentials via Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
        email,
        password,
    });

    if (updateError) {
        const friendlyMessage = mapAuthError(updateError);
        devLog.error('[anonymousAuthService] Failed to update user:', updateError);
        throw new Error(friendlyMessage);
    }

    // Update profile with email and mark as upgraded
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            email,
            display_name: displayName || 'Storyteller',
            is_anonymous: false,
            upgraded_at: new Date().toISOString(),
        })
        .eq('id', user.id);

    if (profileError) {
        devLog.error('[anonymousAuthService] Failed to update profile:', profileError);
        // Don't throw - auth upgrade succeeded, profile update is secondary
    }

    // Sync local profile to remote (best effort)
    try {
        const local = await getLocalProfile(user.id);
        if (local) {
            await updateLocalProfile(user.id, {
                displayName: displayName || local.displayName,
                birthDate: local.birthDate ?? undefined,
                language: local.language ?? undefined,
                fontScaleIndex: local.fontScaleIndex ?? undefined,
                avatarUri: local.avatarUri ?? undefined,
                avatarUrl: local.avatarUrl ?? undefined,
                role: local.role ?? undefined,
                isAnonymous: false,
            });

            await updateProfile(user.id, {
                displayName: displayName || local.displayName || undefined,
                birthDate: local.birthDate ?? undefined,
                language: local.language ?? undefined,
                fontScaleIndex: local.fontScaleIndex ?? undefined,
                avatarUri: local.avatarUri ?? undefined,
                avatarUrl: local.avatarUrl ?? undefined,
                role: local.role ?? undefined,
            });
        }
    } catch (syncError) {
        devLog.warn('[anonymousAuthService] Local profile sync skipped:', syncError);
    }

    // Auto-generate recovery code for the new account
    let recoveryCode = '';
    try {
        const codeResult = await generateRecoveryCodeInternal(user.id);
        recoveryCode = codeResult.code;
        devLog.info('[anonymousAuthService] Recovery code generated for upgraded account');
    } catch (error) {
        devLog.error('[anonymousAuthService] Failed to generate recovery code:', error);
        // Don't fail the upgrade if recovery code generation fails
        // User can generate it manually later in settings
        recoveryCode = '';
    }

    // Refresh session to clear is_anonymous flag in local JWT/User object
    try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) throw refreshError;
        
        devLog.info('[anonymousAuthService] Session refreshed successfully after upgrade:', refreshData.user?.id);
        
        // Brief delay to allow session storage to persist across all platform listeners
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (refreshError) {
        devLog.warn('[anonymousAuthService] Session refresh warning (non-fatal):', refreshError);
    }

    devLog.info('[anonymousAuthService] Account upgraded successfully');

    return { recoveryCode };
}

/**
 * Internal function to generate recovery code.
 * Aligned with database format: REC-XXXXXX
 */
async function generateRecoveryCodeInternal(userId: string): Promise<{ code: string }> {
    // Generate unique code: REC-XXXXXX format
    const codeNum = Math.floor(100000 + Math.random() * 900000);
    const code = `REC-${codeNum}`;

    // Insert recovery code
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365); // 1 year expiry

    const { error } = await supabase.from('recovery_codes').insert({
        user_id: userId,
        code: code,
        expires_at: expiresAt.toISOString(),
    });

    if (error) {
        throw new Error(`Failed to generate recovery code: ${error.message}`);
    }

    return { code };
}

/**
 * Check if current user is anonymous.
 * 
 * @returns True if user is anonymous, false otherwise
 */
export async function isAnonymousUser(): Promise<boolean> {
    const {
        data: authData,
    } = await supabase.auth.getUser();

    return authData?.user?.is_anonymous || false;
}

/**
 * Get anonymous account status.
 * 
 * @returns Account information including upgrade status
 */
export async function getAnonymousAccountStatus(): Promise<{
    isAnonymous: boolean;
    createdAt: string | null;
    upgradedAt: string | null;
}> {
    const {
        data: authData,
    } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
        return {
            isAnonymous: false,
            createdAt: null,
            upgradedAt: null,
        };
    }

    // Get profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_anonymous, created_at, upgraded_at')
        .eq('id', user.id)
        .single();

    return {
        isAnonymous: user.is_anonymous || profile?.is_anonymous || false,
        createdAt: profile?.created_at || null,
        upgradedAt: profile?.upgraded_at || null,
    };
}
