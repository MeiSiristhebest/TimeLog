/**
 * Family Interaction Service
 *
 * Provides functions for family-to-senior bonding requests,
 * recovery code generation, and topic suggestions.
 */

import { supabase } from '@/lib/supabase';
import { devLog } from '@/lib/devLogger';

export interface BondingRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface SuggestedTopic {
  id: string;
  senior_id: string;
  family_member_id: string;
  question_text: string;
  is_accepted: boolean;
  created_at: string;
}

/**
 * Creates a new bonding request from Family to Senior.
 */
export async function createBondingRequest(seniorId: string): Promise<BondingRequest> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Not authenticated');
  const user = userData.user;

  const { data, error } = await supabase
    .from('bonding_requests')
    .insert({
      requester_id: user.id,
      target_id: seniorId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    devLog.error('[familyInteractionService] Failed to create bonding request:', error.message);
    throw new Error(`Failed to request bonding: ${error.message}`);
  }

  return data as BondingRequest;
}

/**
 * Fetches pending requests for the current user (Senior).
 */
export async function fetchPendingRequestsForSenior(): Promise<BondingRequest[]> {
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data?.user) return [];
  const user = data.user;

  const { data: requests, error } = await supabase
    .from('bonding_requests')
    .select('*')
    .eq('target_id', user.id)
    .eq('status', 'pending');

  if (error) {
    devLog.error('[familyInteractionService] Failed to fetch requests:', error.message);
    throw new Error(`Failed to fetch requests: ${error.message}`);
  }

  return (requests || []) as BondingRequest[];
}

/**
 * Responds to a bonding request (Senior).
 */
export async function respondToRequest(requestId: string, status: 'approved' | 'rejected'): Promise<void> {
  const { error } = await supabase.rpc('respond_to_bonding_request', {
    p_request_id: requestId,
    p_status: status
  });

  if (error) {
    devLog.error('[familyInteractionService] Failed to respond to request:', error.message);
    throw new Error(`Failed to respond to request: ${error.message}`);
  }
}

/**
 * Submits a suggested topic from Family to Senior.
 * Uses existing 'family_questions' table.
 */
export async function suggestTopicFromFamily(seniorId: string, text: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) throw new Error('Not authenticated');
  const user = userData.user;

  const { error } = await supabase
    .from('family_questions')
    .insert({
      senior_user_id: seniorId,
      family_user_id: user.id,
      question_text: text
    });

  if (error) {
    devLog.error('[familyInteractionService] Failed to suggest topic:', error.message);
    throw new Error(`Failed to suggest topic: ${error.message}`);
  }
}

/**
 * Generates a recovery code for a linked senior by a family member.
 */
export async function generateRecoveryCodeByFamily(seniorId: string): Promise<{ code: string; expiresAt: string }> {
  const { data, error } = await supabase.rpc('generate_senior_recovery_code', {
    p_senior_id: seniorId
  });

  if (error) {
    devLog.error('[familyInteractionService] Failed to generate recovery code:', error.message);
    throw new Error(`Failed to generate recovery code: ${error.message}`);
  }

  return {
    code: data[0].display_code,
    expiresAt: data[0].expires_at
  };
}
