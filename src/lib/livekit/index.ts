/**
 * LiveKit Initialization
 * 
 * Registers LiveKit globals for React Native environment.
 * Must be called before any LiveKit SDK usage.
 * 
 * @see https://docs.livekit.io/home/client/sdk-platforms/react-native/
 */

import { registerGlobals } from '@livekit/react-native';
import { Platform } from 'react-native';

let isRegistered = false;

/**
 * Initialize LiveKit SDK for React Native
 * Safe to call multiple times (idempotent)
 */
export function initializeLiveKit(): void {
  if (Platform.OS === 'web') {
    return;
  }

  if (isRegistered) {
    return;
  }

  registerGlobals();
  isRegistered = true;
}

/**
 * Check if LiveKit is initialized
 */
export function isLiveKitInitialized(): boolean {
  return isRegistered;
}
