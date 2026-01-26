/**
 * useCloudSettings Hook
 *
 * Manages Cloud AI & Sharing settings with local persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { devLog } from '@/lib/devLogger';
import { getCloudSettings, saveCloudSettings } from '../services/cloudSettingsService';

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
        const settings = await getCloudSettings();
        setCloudAIEnabledState(settings.cloudAIEnabled);
      } catch (error) {
        devLog.error('Failed to load cloud settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const setCloudAIEnabled = useCallback(async (enabled: boolean) => {
    try {
      setCloudAIEnabledState(enabled);

      await saveCloudSettings(enabled);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      devLog.error('Failed to save cloud settings:', error);
      // Revert on local storage error
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
    const settings = await getCloudSettings();
    return settings.cloudAIEnabled;
  } catch (error) {
    devLog.error('Failed to get cloud settings:', error);
    return true;
  }
}
