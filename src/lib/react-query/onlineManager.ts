import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

let unsubscribe: (() => void) | null = null;

export function initializeOnlineManager(): void {
  if (unsubscribe) return;

  unsubscribe = NetInfo.addEventListener((state) => {
    onlineManager.setOnline(state.isConnected ?? false);
  });

  // seed initial state
  NetInfo.fetch().then((state) => {
    onlineManager.setOnline(state.isConnected ?? false);
  });
}

export function cleanupOnlineManager(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

export function __getInternalState() {
  return { hasListener: Boolean(unsubscribe) };
}
