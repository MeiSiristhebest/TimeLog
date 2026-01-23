/**
 * useUnreadActivities - Hook for fetching and managing unread activities.
 * 
 * Story 5.1: Home Contextual Insights (AC: 1-4)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    getUnreadActivities,
    subscribeToActivities,
    Activity,
} from '../services/activityService';

const QUERY_KEY = 'unread-activities';

export function useUnreadActivities() {
    const queryClient = useQueryClient();
    const sessionUserId = useAuthStore((state) => state.sessionUserId);
    const queryKey = [QUERY_KEY, sessionUserId];

    const {
        data: activities = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey,
        queryFn: () => getUnreadActivities(sessionUserId!),
        enabled: !!sessionUserId,
        staleTime: 30 * 1000, // 30 seconds
    });

    // Subscribe to real-time updates
    useEffect(() => {
        if (!sessionUserId) return;

        const unsubscribe = subscribeToActivities(sessionUserId, (newActivity) => {
            queryClient.setQueryData<Activity[]>(queryKey, (old = []) => {
                // Add new activity at the beginning
                return [newActivity, ...old];
            });
        });

        return unsubscribe;
    }, [sessionUserId, queryClient, queryKey]);

    return {
        activities,
        isLoading,
        error,
        hasUnread: activities.length > 0,
        refetch,
    };
}
