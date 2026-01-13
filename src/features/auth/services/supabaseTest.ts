import { supabase } from '@/lib/supabase';

type ProfileRow = {
  id: string;
};

type SupabaseTestResult = {
  profilesCount: number;
  sessionUserId?: string;
};

export const signInTestUser = async (): Promise<string | undefined> => {
  const email = process.env.EXPO_PUBLIC_SUPABASE_TEST_EMAIL;
  const password = process.env.EXPO_PUBLIC_SUPABASE_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_TEST_EMAIL or EXPO_PUBLIC_SUPABASE_TEST_PASSWORD.'
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Sign-in error: ${error.message}`);
  }
  return data.session?.user?.id;
};

export const testSupabaseConnection = async (): Promise<SupabaseTestResult> => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Session error: ${sessionError.message}`);
  }

  const sessionUserId = sessionData.session?.user?.id;

  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
  if (profilesError) {
    throw new Error(`Profiles error: ${profilesError.message}`);
  }

  const ownProfiles = sessionUserId
    ? (profiles as ProfileRow[]).filter((p) => p.id === sessionUserId)
    : [];

  return {
    profilesCount: ownProfiles.length,
    sessionUserId,
  };
};
