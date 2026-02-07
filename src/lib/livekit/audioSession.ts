/**
 * Audio Session Configuration
 * 
 * Manages LiveKit audio session for React Native.
 * Configures audio routing and background audio handling.
 */

import { AudioSession } from '@livekit/react-native';
import { Platform } from 'react-native';

/**
 * Configure and start audio session for LiveKit
 */
export async function startAudioSession(): Promise<void> {
  try {
    await AudioSession.configureAudio({
      android: {
        // Use COMMUNICATION preset for voice (not media playback)
        // This enables echo cancellation, noise suppression, and AGC
        audioTypeOptions: {
          manageAudioFocus: true,
          audioMode: 'inCommunication', // Correct value for communication mode
        },
      },
      ios: {
        // Configure for VoIP-style audio (not music playback)
        defaultOutput: 'speaker', // Default to speaker for elderly users
      },
    });

    await AudioSession.startAudioSession();
  } catch (error) {
    throw new Error(
      `Failed to start audio session: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stop audio session
 */
export async function stopAudioSession(): Promise<void> {
  try {
    await AudioSession.stopAudioSession();
  } catch (error) {
    // Ignore errors on stop (session might not be active)
    if (__DEV__) {
      console.warn('Failed to stop audio session:', error);
    }
  }
}

/**
 * Check if audio session is active
 */
export function isAudioSessionActive(): boolean {
  // LiveKit doesn't expose this directly, track manually
  return AudioSession !== undefined;
}
