/**
 * useCloudSettings Hook
 * 
 * Manages Cloud AI & Sharing settings with local persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const CLOUD_SETTINGS_KEY = '@timelog/cloud_settings';

type CloudSettings = {
    cloudAIEnabled: boolean;
    lastUpdated: string;
};

type UseCloudSettingsResult = {
    cloudAIEnabled: boolean;
    isLoading: boolean;
    setCloudAIEnabled: (enabled: boolean) => Promise<void>;
};

export function useCloudSettings(): UseCloudSettingsResult {
    const [cloudAIEnabled, setCloudAIEnabledState] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Load settings on mount
    useEffect(() => {
        async function loadSettings() {
            try {
                const stored = await AsyncStorage.getItem(CLOUD_SETTINGS_KEY);
                if (stored) {
                    const settings: CloudSettings = JSON.parse(stored);
                    setCloudAIEnabledState(settings.cloudAIEnabled);
                }
            } catch (error) {
                console.error('Failed to load cloud settings:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, []);

    const setCloudAIEnabled = useCallback(async (enabled: boolean) => {
        try {
            setCloudAIEnabledState(enabled);

            const settings: CloudSettings = {
                cloudAIEnabled: enabled,
                lastUpdated: new Date().toISOString(),
            };

            await AsyncStorage.setItem(CLOUD_SETTINGS_KEY, JSON.stringify(settings));

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // TODO: Sync to Supabase user_settings table when online

        } catch (error) {
            console.error('Failed to save cloud settings:', error);
            // Revert on error
            setCloudAIEnabledState(!enabled);
            throw error;
        }
    }, []);

    return {
        cloudAIEnabled,
        isLoading,
        setCloudAIEnabled,
    };
}

/**
 * Get the current cloud AI enabled status synchronously (for use in recording)
 */
export async function getCloudAIEnabled(): Promise<boolean> {
    try {
        const stored = await AsyncStorage.getItem(CLOUD_SETTINGS_KEY);
        if (stored) {
            const settings: CloudSettings = JSON.parse(stored);
            return settings.cloudAIEnabled;
        }
        return true; // Default to enabled
    } catch (error) {
        console.error('Failed to get cloud settings:', error);
        return true;
    }
}
