import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { devLog } from './devLogger';
import { getSupabaseRuntimeConfig } from '@/lib/config/runtimeConfig';

const { url: supabaseUrl, anonKey: supabaseAnonKey, isConfigured } = getSupabaseRuntimeConfig();

const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

if (!isConfigured) {
  devLog.warn(
    'Supabase env vars missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable auth.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
