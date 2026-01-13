import { supabase } from '@/lib/supabase';

export const signInWithEmailPassword = async (email: string, password: string) => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      throw new Error('Email or password is incorrect. Please try again.');
    }
    throw new Error(error.message);
  }

  return data.session?.user;
};

export const sendResetEmail = async (email: string) => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error('Please enter your email to receive a reset link.');
  }

  const redirectTo = process.env.EXPO_PUBLIC_SUPABASE_RESET_REDIRECT ?? 'timelog://login';
  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });

  if (error) {
    throw new Error(error.message);
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};
