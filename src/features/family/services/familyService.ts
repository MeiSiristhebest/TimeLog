import { supabase } from '@/lib/supabase';
import { FamilyMemberMock } from '../data/mockFamilyData';

// Map DB response to UI model
export type FamilyMember = FamilyMemberMock;

/**
 * Fetch connected family members for the current user.
 * Uses RPC 'get_family_members' to get safely formatted list.
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase.rpc('get_family_members');

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return [];

  // Transform to match UI model if needed, or assume RPC returns 1:1
  // Assuming RPC returns snake_case, need to map to camelCase
  return (data as any[]).map((item) => ({
    id: item.user_id || item.id,
    name: item.display_name || item.name || 'Unknown',
    email: item.email || '',
    avatarUrl: item.avatar_url,
    role: item.role || 'member',
    linkedAt: item.linked_at ? new Date(item.linked_at).toLocaleDateString() : 'Recently',
  }));
}

/**
 * Remove a family member connection.
 */
export async function removeFamilyMember(targetUserId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_family_member', {
    p_target_user_id: targetUserId,
  });

  if (error) {
    throw new Error(error.message);
  }
}
