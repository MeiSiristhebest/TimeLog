// Elderly-friendly VAD defaults: tolerate 3-5s pauses before treating as silence.
export const ELDERLY_VAD_CONFIG = {
  silenceThresholdMs: 4000, // center value between 3-5s
  silenceDbThreshold: -45,
  minSpeechMs: 200,
  sampleRate: 16000,
};

export function isSilence(silenceDurationMs: number): boolean {
  return silenceDurationMs >= ELDERLY_VAD_CONFIG.silenceThresholdMs;
}

export function isSilentMetering(metering?: number | null): boolean {
  return typeof metering === 'number' && metering <= ELDERLY_VAD_CONFIG.silenceDbThreshold;
}
