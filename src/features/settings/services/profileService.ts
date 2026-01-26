/**
 * Profile Service
 *
 * Handles user profile CRUD operations with Supabase.
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export type UserProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'storyteller' | 'family';
  bio: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileUpdate = {
  displayName?: string;
  avatarUrl?: string;
  role?: 'storyteller' | 'family';
  bio?: string;
};

type DatabaseProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'storyteller' | 'family' | null;
  bio: string | null;
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
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: updates.displayName,
      avatar_url: updates.avatarUrl,
      role: updates.role,
      bio: updates.bio,
      updated_at: new Date().toISOString(),
    })
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
    avatarUrl: data.avatar_url,
    role: data.role || 'storyteller',
    bio: data.bio,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
