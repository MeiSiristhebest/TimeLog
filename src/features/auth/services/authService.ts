import { supabase } from '@/lib/supabase';
import { checkRateLimit, recordAttempt, clearRateLimit, RateLimitError } from '@/lib/rateLimiter';
import type { User } from '@supabase/supabase-js';
import { mapAuthError } from './anonymousAuthService';
import { setCloudAiEnabled } from '@/lib/cloudPolicy';
import { syncQueueService } from '@/lib/sync-engine/queue';
import { useAuthStore } from '../store/authStore';
import { devLog } from '@/lib/devLogger';

// Re-export RateLimitError for consumers
export { RateLimitError };

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<User | undefined> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  // Check rate limit BEFORE attempting login
  await checkRateLimit('login', trimmedEmail);

  // Record the attempt
  recordAttempt('login', trimmedEmail);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      throw new Error('Email or password is incorrect. Please try again.');
    }
    throw new Error(mapAuthError(error));
  }

  // Clear rate limit on successful login
  clearRateLimit('login', trimmedEmail);

  try {
    setCloudAiEnabled(true);
    await syncQueueService.reEnqueueOfflineRecordings();
    devLog.info('[authService] Cloud AI enabled and offline recordings enqueued on login');
  } catch (syncError) {
    devLog.warn('[authService] Failed to enqueue offline recordings on login:', syncError);
  }

  return data.session?.user;
}

export async function signUpWithEmailPassword(
  email: string,
  password: string,
  displayName: string
): Promise<User | undefined> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  // Check rate limit BEFORE attempting sign up
  await checkRateLimit('signup', trimmedEmail);

  // Record the attempt
  recordAttempt('signup', trimmedEmail);

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    throw new Error(mapAuthError(error));
  }

  // Clear rate limit on successful sign up
  clearRateLimit('signup', trimmedEmail);

  try {
    // Automatically enable Cloud AI and sync recordings on successful sign-up
    setCloudAiEnabled(true);
    await syncQueueService.reEnqueueOfflineRecordings();
    devLog.info('[authService] Cloud AI enabled and offline recordings enqueued on signup');
  } catch (syncError) {
    devLog.warn('[authService] Failed to enqueue offline recordings on signup:', syncError);
  }

  return data.user ?? undefined;
}

export async function sendResetEmail(email: string): Promise<void> {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error('Please enter your email to receive a reset link.');
  }

  // Check rate limit for password reset
  await checkRateLimit('passwordReset', trimmedEmail);

  // Record the attempt
  recordAttempt('passwordReset', trimmedEmail);

  const redirectTo = process.env.EXPO_PUBLIC_SUPABASE_RESET_REDIRECT ?? 'timelog://login';
  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });

  if (error) {
    throw new Error(mapAuthError(error));
  }

  // Note: Don't clear rate limit on success for password reset
  // to prevent enumeration attacks
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(mapAuthError(error));
  }
  useAuthStore.getState().setUnauthenticated();
}
