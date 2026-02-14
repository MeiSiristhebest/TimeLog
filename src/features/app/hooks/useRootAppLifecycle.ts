import { useCallback, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { useDeepLinkHandler } from '@/features/auth/hooks/useDeepLinkHandler';
import { playOfflineCue, playOnlineCue } from '@/features/recorder/services/soundCueService';
import { useSyncStore } from '@/lib/sync-engine/store';
import { registerSyncSoundCues } from '@/lib/sync-engine/soundCues';

interface UseRootAppLifecycleParams {
  readonly fontsLoaded: boolean;
  readonly dbReady: boolean;
  readonly surfaceColor: string;
}

export function useRootAppLifecycle({
  fontsLoaded,
  dbReady,
  surfaceColor,
}: Readonly<UseRootAppLifecycleParams>): { readonly onLayoutRootView: () => void } {
  useDeepLinkHandler();

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  useEffect(() => {
    void setBackgroundColorAsync(surfaceColor);
  }, [surfaceColor]);

  useEffect(() => {
    registerSyncSoundCues({ playOnlineCue, playOfflineCue });
    useSyncStore.getState().initializeListeners();
    return () => {
      registerSyncSoundCues(null);
      useSyncStore.getState().cleanupListeners();
    };
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded && dbReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  return { onLayoutRootView };
}
