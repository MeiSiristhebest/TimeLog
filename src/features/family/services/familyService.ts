import { supabase } from '@/lib/supabase';
import { FamilyMemberMock } from '../data/mockFamilyData';

// Map DB response to UI model
export type FamilyMember = FamilyMemberMock;

type FamilyMemberRpcRow = {
  user_id?: string | null;
  id?: string | null;
  display_name?: string | null;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  linked_at?: string | null;
};

/**
 * Fetch connected family members for the current user.
 * Uses RPC 'get_family_members' to get safely formatted list.
 */
export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase.rpc('get_family_members');

  if (error) {
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) return [];

  // Transform to match UI model if needed, or assume RPC returns 1:1
  // Assuming RPC returns snake_case, need to map to camelCase
  return data.map((entry) => {
    const item = entry as FamilyMemberRpcRow;
    const role: FamilyMember['role'] = item.role === 'admin' ? 'admin' : 'member';
    return {
      id: item.user_id ?? item.id ?? 'unknown',
      name: item.display_name ?? item.name ?? 'Unknown',
      email: item.email ?? '',
      avatarUrl: item.avatar_url ?? null,
      role,
      linkedAt: item.linked_at ? new Date(item.linked_at).toLocaleDateString() : 'Recently',
    };
  });
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
