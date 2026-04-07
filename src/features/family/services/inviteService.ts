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

/**
 * Utility to map invite-related errors to user-friendly messages.
 */
function mapInviteError(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const message = error.message || '';

  if (message.includes('Invite already exists')) {
    return 'An invitation has already been sent to this email address.';
  }
  if (message.includes('User already connected')) {
    return 'This person is already connected to your family.';
  }
  if (message.includes('Invalid token') || message.includes('Request not found')) {
    return 'This invitation link is invalid or has expired.';
  }
  if (message.includes('Unauthorized')) {
    return 'You do not have permission to perform this invitation action.';
  }

  return message;
}

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
    throw new Error(mapInviteError(error));
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
    throw new Error(mapInviteError(error));
  }
}

function buildInviteLink(token: string): string {
  if (__DEV__) {
    return Linking.createURL('accept-invite', { queryParams: { token } });
  }

  const base = process.env.EXPO_PUBLIC_INVITE_REDIRECT_URL ?? 'timelog://accept-invite';
  return `${base}?token=${token}`;
}
