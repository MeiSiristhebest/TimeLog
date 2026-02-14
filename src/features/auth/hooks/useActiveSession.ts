import { useQuery, type QueryObserverResult } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { getActiveSession } from '@/features/auth/services/sessionService';

const ACTIVE_SESSION_QUERY_KEY = ['auth', 'active-session'] as const;

type UseActiveSessionOptions = {
  enabled?: boolean;
};

type UseActiveSessionResult = {
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<Session | null, Error>>;
};

export function useActiveSession(options?: UseActiveSessionOptions): UseActiveSessionResult {
  const { enabled = true } = options ?? {};

  const { data, isLoading, error, refetch } = useQuery<Session | null, Error>({
    queryKey: ACTIVE_SESSION_QUERY_KEY,
    queryFn: getActiveSession,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled,
  });

  return {
    session: data ?? null,
    isLoading,
    error: error ?? null,
    refetch,
  };
}
