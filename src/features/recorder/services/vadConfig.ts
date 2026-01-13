// Elderly-friendly VAD defaults: tolerate 3-5s pauses before treating as silence.
export const ELDERLY_VAD_CONFIG = {
  silenceThresholdMs: 4000, // center value between 3-5s
  minSpeechMs: 200,
  sampleRate: 16000,
};

export const isSilence = (silenceDurationMs: number) =>
  silenceDurationMs >= ELDERLY_VAD_CONFIG.silenceThresholdMs;
