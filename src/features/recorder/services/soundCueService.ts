import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { captureError } from '@/lib/logger';

/**
 * SoundCueService manages low-latency audio feedback for recording events.
 *
 * Key features:
 * - Preloads success sound for <100ms playback latency (NFR2)
 * - Respects system audio settings (silent/vibrate mode)
 * - Provides haptic feedback as fallback
 * - Logs errors without blocking UI flow
 */

const SUCCESS_CUE_SOURCE = require('../../../../assets/sounds/success-ding.wav');

let successSound: Audio.Sound | null = null;
let isInitialized = false;
let loadPromise: Promise<Audio.Sound | null> | null = null;

const loadSoundCue = async (): Promise<Audio.Sound | null> => {
  if (successSound) return successSound;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        SUCCESS_CUE_SOURCE,
        { shouldPlay: false }
      );

      successSound = sound;
      isInitialized = true;
      return sound;
    } catch (error) {
      captureError(error, { scope: 'sound-cue', action: 'init' });
      return null;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
};

/**
 * Initialize the sound cue service by preloading the success sound.
 * Should be called when the recorder screen mounts.
 */
export async function initializeSoundCue(): Promise<void> {
  if (isInitialized) return;
  await loadSoundCue();
}

/**
 * Play the success sound cue with low latency.
 * Falls back to haptic feedback if sound fails.
 */
export async function playSuccess(): Promise<void> {
  try {
    // Always provide haptic feedback (works in silent mode)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'haptic' });
  }

  const sound = successSound ?? (await loadSoundCue());
  if (!sound) return;

  try {
    await sound.replayAsync();
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'play' });
  }
}

/**
 * Cleanup resources when the recorder screen unmounts.
 */
export async function cleanupSoundCue(): Promise<void> {
  if (!successSound) return;

  try {
    await successSound.unloadAsync();
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'cleanup' });
  } finally {
    successSound = null;
    isInitialized = false;
    loadPromise = null;
  }
}

/**
 * Check if sound cue is ready to play.
 */
export function isSoundCueReady(): boolean {
  return isInitialized && !!successSound;
}
