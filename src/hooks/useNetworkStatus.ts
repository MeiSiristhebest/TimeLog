/**
 * Hook to monitor network connectivity and update sync store.
 * Should be called once in root layout to initialize global listener.
 */

import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useSyncStore } from '@/lib/sync-engine/store';

export const useNetworkStatus = () => {
  const setOnline = useSyncStore((s) => s.setOnline);
  const isOnline = useSyncStore((s) => s.isOnline);

  useEffect(() => {
    // Fetch initial network state
    NetInfo.fetch().then((state) => {
      setOnline(state.isConnected ?? false);
    });

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, [setOnline]);

  return { isOnline };
};
