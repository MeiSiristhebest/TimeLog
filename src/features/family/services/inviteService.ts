import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

export const createFamilyInvite = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error('Email is required.');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new Error('Please enter a valid email address.');
  }

  const { data, error } = await supabase.rpc('create_family_invite', {
    p_email: normalized,
  });

  if (error) {
    throw new Error(error.message);
  }

  const token = Array.isArray(data) ? data[0]?.invite_token : ((data as any)?.invite_token ?? data);
  const inviteLink = token ? buildInviteLink(String(token)) : undefined;
  return { token: token as string | undefined, inviteLink };
};

export const acceptFamilyInvite = async (token: string) => {
  if (!token) {
    throw new Error('Invite token is required.');
  }

  const { error } = await supabase.rpc('accept_family_invite', { p_token: token });

  if (error) {
    throw new Error(error.message);
  }
};

const buildInviteLink = (token: string) => {
  if (__DEV__) {
    return Linking.createURL('accept-invite', { queryParams: { token } });
  }

  const base = process.env.EXPO_PUBLIC_INVITE_REDIRECT_URL ?? 'timelog://accept-invite';
  return `${base}?token=${token}`;
};
