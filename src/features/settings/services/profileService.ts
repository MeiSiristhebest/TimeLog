/**
 * Profile Service
 *
 * Handles user profile CRUD operations with Supabase.
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';
import type { UserProfile } from '@/types/entities';

export type { UserProfile };

export type ProfileUpdate = {
  displayName?: string;
  birthDate?: string;
  language?: string;
  fontScaleIndex?: number;
  avatarUri?: string;
  avatarUrl?: string;
  role?: 'storyteller' | 'family';
  bio?: string;
};

type DatabaseProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  birth_date?: string | null;
  language?: string | null;
  font_scale_index?: number | null;
  avatar_uri?: string | null;
  avatar_url: string | null;
  role: 'storyteller' | 'family' | null;
  bio: string | null;
  is_anonymous?: boolean | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get user profile by user ID
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No profile found, return null
      return null;
    }
    devLog.error('Failed to fetch profile:', error);
    throw error;
  }

  return mapToProfile(data);
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<UserProfile> {
  const payload: Record<string, string | number | boolean | null> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.displayName !== undefined) payload.display_name = updates.displayName;
  if (updates.birthDate !== undefined) payload.birth_date = updates.birthDate;
  if (updates.language !== undefined) payload.language = updates.language;
  if (updates.fontScaleIndex !== undefined) payload.font_scale_index = updates.fontScaleIndex;
  if (updates.avatarUri !== undefined) payload.avatar_uri = updates.avatarUri;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.bio !== undefined) payload.bio = updates.bio;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    devLog.error('Failed to update profile:', error);
    throw error;
  }

  return mapToProfile(data);
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  const filename = `${userId}/avatar-${Date.now()}.jpg`;

  // Fetch the image as blob
  const response = await fetch(imageUri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage.from('avatars').upload(filename, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (uploadError) {
    devLog.error('Failed to upload avatar:', uploadError);
    throw uploadError;
  }

  // Get public URL
  const { data } = supabase.storage.from('avatars').getPublicUrl(filename);

  // Update profile with new avatar URL
  await updateProfile(userId, { avatarUrl: data.publicUrl });

  return data.publicUrl;
}

/**
 * Create initial profile for new user
 */
export async function createProfile(
  userId: string,
  displayName: string,
  role: 'storyteller' | 'family'
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      display_name: displayName,
      role: role,
    })
    .select()
    .single();

  if (error) {
    devLog.error('Failed to create profile:', error);
    throw error;
  }

  return mapToProfile(data);
}

// Helper to map DB response to UserProfile type
function mapToProfile(data: DatabaseProfile): UserProfile {
  return {
    id: data.id,
    userId: data.user_id,
    displayName: data.display_name,
    birthDate: data.birth_date ?? null,
    language: data.language ?? null,
    fontScaleIndex: data.font_scale_index ?? null,
    avatarUri: data.avatar_uri ?? null,
    avatarUrl: data.avatar_url,
    role: data.role || 'storyteller',
    bio: data.bio,
    isAnonymous: data.is_anonymous ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
