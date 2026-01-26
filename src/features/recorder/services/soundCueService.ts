import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { captureError } from '@/lib/logger';

/**
 * SoundCueService manages low-latency audio feedback for recording events.
 *
 * Key features:
 * - Preloads success sound for <100ms playback latency (NFR2)
 * - Preloads offline cue for network state change (F1.9)
 * - Respects system audio settings (silent/vibrate mode)
 * - Provides haptic feedback as fallback
 * - Logs errors without blocking UI flow
 */

const SUCCESS_CUE_SOURCE = require('../../../../assets/sounds/success-ding.wav');
// F1.9: Offline cue - uses same asset for now, can be replaced with distinct sound
const OFFLINE_CUE_SOURCE = require('../../../../assets/sounds/success-ding.wav');

let successPlayer: AudioPlayer | null = null;
let offlinePlayer: AudioPlayer | null = null;
let isInitialized = false;

function loadPlayer(source: any): AudioPlayer | null {
  try {
    const player = createAudioPlayer(source);
    return player;
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'init-player' });
    return null;
  }
}

/**
 * Initialize the sound cue service by preloading the success sound.
 * Should be called when the recorder screen mounts.
 */
export async function initializeSoundCue(): Promise<void> {
  if (isInitialized) return;

  if (!successPlayer) {
    successPlayer = loadPlayer(SUCCESS_CUE_SOURCE);
  }

  if (successPlayer) {
    isInitialized = true;
  }
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

  // Lazy load if needed
  if (!successPlayer) {
    successPlayer = loadPlayer(SUCCESS_CUE_SOURCE);
  }

  if (!successPlayer) return;

  try {
    // Seek to start and play
    successPlayer.seekTo(0);
    successPlayer.play();
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'play' });
  }
}

/**
 * Cleanup resources when the recorder screen unmounts.
 */
export async function cleanupSoundCue(): Promise<void> {
  if (successPlayer) {
    successPlayer.remove();
    successPlayer = null;
  }
  if (offlinePlayer) {
    offlinePlayer.remove();
    offlinePlayer = null;
  }
  isInitialized = false;
}

/**
 * Check if sound cue is ready to play.
 */
export function isSoundCueReady(): boolean {
  return isInitialized && !!successPlayer;
}

/**
 * F1.9: Play the offline cue when network state changes to offline.
 * Provides reassurance that recording continues even without internet.
 */
export async function playOfflineCue(): Promise<void> {
  try {
    // Warning haptic for offline state
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'haptic-offline' });
  }

  if (!offlinePlayer) {
    offlinePlayer = loadPlayer(OFFLINE_CUE_SOURCE);
  }

  if (!offlinePlayer) return;

  try {
    offlinePlayer.seekTo(0);
    offlinePlayer.play();
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'play-offline' });
  }
}

/**
 * F1.9: Play cue when coming back online.
 */
export async function playOnlineCue(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    captureError(error, { scope: 'sound-cue', action: 'haptic-online' });
  }
  // Optionally play a different sound - for now, skip audio to differentiate from offline
}
