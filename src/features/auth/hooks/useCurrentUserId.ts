import { useQuery } from '@tanstack/react-query';
import { getCurrentUserId } from '@/features/auth/services/sessionService';

const CURRENT_USER_ID_QUERY_KEY = ['auth', 'current-user-id'] as const;

type UseCurrentUserIdResult = {
  currentUserId: string | undefined;
  isLoading: boolean;
  error: Error | null;
};

type UseCurrentUserIdOptions = {
  enabled?: boolean;
};

export function useCurrentUserId(options?: UseCurrentUserIdOptions): UseCurrentUserIdResult {
  const { enabled = true } = options ?? {};

  const { data, isLoading, error } = useQuery<string | null, Error>({
    queryKey: CURRENT_USER_ID_QUERY_KEY,
    queryFn: getCurrentUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled,
  });

  return {
    currentUserId: data ?? undefined,
    isLoading,
    error: error ?? null,
  };
}
