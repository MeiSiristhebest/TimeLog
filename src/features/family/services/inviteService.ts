import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

/**
 * Response type from create_family_invite RPC.
 * Can return single object or array depending on Supabase version.
 */
type InviteResponse = { invite_token: string } | { invite_token: string }[] | string;

type FamilyInviteResult = {
  token?: string;
  inviteLink?: string;
};

export async function createFamilyInvite(email: string): Promise<FamilyInviteResult> {
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

  // Handle various response formats from Supabase RPC
  let token: string | undefined;
  const response = data as InviteResponse;

  if (Array.isArray(response)) {
    token = response[0]?.invite_token;
  } else if (typeof response === 'object' && response !== null) {
    token = response.invite_token;
  } else if (typeof response === 'string') {
    token = response;
  }

  const inviteLink = token ? buildInviteLink(token) : undefined;
  return { token, inviteLink };
}

export async function acceptFamilyInvite(token: string): Promise<void> {
  if (!token) {
    throw new Error('Invite token is required.');
  }

  const { error } = await supabase.rpc('accept_family_invite', { p_token: token });

  if (error) {
    throw new Error(error.message);
  }
}

function buildInviteLink(token: string): string {
  if (__DEV__) {
    return Linking.createURL('accept-invite', { queryParams: { token } });
  }

  const base = process.env.EXPO_PUBLIC_INVITE_REDIRECT_URL ?? 'timelog://accept-invite';
  return `${base}?token=${token}`;
}
