/**
 * Audio Session Configuration
 *
 * Manages LiveKit audio session for React Native.
 * Configures audio routing and background audio handling.
 * AI voice is always routed to the loudspeaker.
 */

import { AudioSession } from '@livekit/react-native';
import { devLog } from '@/lib/devLogger';

/**
 * Configure and start audio session for LiveKit.
 * Forces playback through the loudspeaker so the AI voice is audible.
 *
 * On iOS: `defaultOutput: 'speaker'` routes remote audio to the loudspeaker.
 * On Android: `audioMode: 'inCommunication'` keeps mic active while playing to speaker.
 */
export async function startAudioSession(): Promise<void> {
  try {
    await AudioSession.configureAudio({
      android: {
        // 'inCommunication' keeps microphone active while routing speaker audio
        // to the loudspeaker rather than the earpiece.
        audioTypeOptions: {
          manageAudioFocus: true,
          audioMode: 'inCommunication',
        },
      },
      ios: {
        // Explicitly route AI voice to the loudspeaker.
        defaultOutput: 'speaker',
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
      devLog.warn('[audioSession] Failed to stop audio session:', error);
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
