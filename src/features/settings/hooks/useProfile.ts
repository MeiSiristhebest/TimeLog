/**
 * useProfile Hook
 * 
 * Manages user profile state with loading and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    getProfile,
    updateProfile,
    uploadAvatar,
    UserProfile,
    ProfileUpdate,
} from '../services/profileService';

type UseProfileResult = {
    profile: UserProfile | null;
    isLoading: boolean;
    error: Error | null;
    updateProfileData: (updates: ProfileUpdate) => Promise<void>;
    uploadProfileAvatar: (imageUri: string) => Promise<string | null>;
    refetch: () => Promise<void>;
};

export function useProfile(): UseProfileResult {
    const sessionUserId = useAuthStore((state) => state.sessionUserId);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!sessionUserId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getProfile(sessionUserId);
            setProfile(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        } finally {
            setIsLoading(false);
        }
    }, [sessionUserId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfileData = useCallback(async (updates: ProfileUpdate) => {
        if (!sessionUserId) return;

        try {
            const updated = await updateProfile(sessionUserId, updates);
            setProfile(updated);
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to update profile');
        }
    }, [sessionUserId]);

    const uploadProfileAvatar = useCallback(async (imageUri: string): Promise<string | null> => {
        if (!sessionUserId) return null;

        try {
            const newAvatarUrl = await uploadAvatar(sessionUserId, imageUri);
            setProfile((prev) => prev ? { ...prev, avatarUrl: newAvatarUrl } : null);
            return newAvatarUrl;
        } catch (err) {
            throw err instanceof Error ? err : new Error('Failed to upload avatar');
        }
    }, [sessionUserId]);

    return {
        profile,
        isLoading,
        error,
        updateProfileData,
        uploadProfileAvatar,
        refetch: fetchProfile,
    };
}
