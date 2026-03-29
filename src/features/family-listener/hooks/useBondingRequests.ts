/**
 * useBondingRequests Hook
 *
 * Listens for real-time changes to the 'bonding_requests' table.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BondingRequest, fetchPendingRequestsForSenior } from '../services/familyInteractionService';
import { devLog } from '@/lib/devLogger';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useBondingRequests() {
  const [activeRequest, setActiveRequest] = useState<BondingRequest | null>(null);
  const sessionUserId = useAuthStore((state) => state.sessionUserId);

  useEffect(() => {
    if (!sessionUserId) return;

    const loadInitial = async () => {
      try {
        const requests = await fetchPendingRequestsForSenior();
        if (requests.length > 0) {
          setActiveRequest(requests[0]);
        }
      } catch (err) {
        devLog.error('[useBondingRequests] Failed to load initial requests:', err);
      }
    };

    void loadInitial();

    const subscription = supabase
      .channel(`bonding_requests_${sessionUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bonding_requests',
          filter: `target_id=eq.${sessionUserId}`,
        },
        (payload) => {
          devLog.debug('[useBondingRequests] New bonding request received:', payload.new);
          setActiveRequest(payload.new as BondingRequest);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, [sessionUserId]);

  const dismissRequest = () => setActiveRequest(null);

  return {
    activeRequest,
    dismissRequest,
  };
}
