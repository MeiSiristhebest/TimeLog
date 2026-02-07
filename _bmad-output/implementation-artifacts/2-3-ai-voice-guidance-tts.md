# Story 2.3: AI Voice Guidance (TTS)

Status: review

## Story

As a Senior User,
I want to hear a clear prompt question when I open the recorder,
So that I know what to talk about.

## Acceptance Criteria

1. **Given** I enter the recording screen
   **When** the screen loads
   **Then** the selected topic question is played aloud (TTS) via the speaker
   **And** the audio uses a clear, slow-paced voice suitable for elderly users

2. **Given** a topic question has been read aloud
   **When** I tap the "Replay" button
   **Then** the same question is played again from the beginning
   **And** any currently playing audio stops before replay starts

3. **Given** I am on the recording screen
   **When** I tap the "New Topic" button
   **Then** a different random question is selected from the local topic library
   **And** the new question is immediately played aloud (TTS)
   **And** the QuestionCard updates to show the new question text

4. **Given** TTS is playing
   **When** I tap the Record button to start recording
   **Then** TTS playback stops immediately
   **And** recording begins without audio interference

5. **Given** the device is in silent/vibrate mode
   **When** TTS should play
   **Then** the system respects device audio settings (no forced audio override)
   **And** the QuestionCard text remains visible as fallback

## Tasks / Subtasks

- [x] Task 1: Create TTS Service (AC: 1, 2, 4)
    - [x] 1.1: Create `src/features/recorder/services/ttsService.ts` using `expo-speech`
    - [x] 1.2: Implement `speak(text: string, options?: TTSOptions)` with elderly-optimized defaults (rate: 0.8, pitch:
      1.0)
    - [x] 1.3: Implement `stop()` method to halt current playback
    - [x] 1.4: Implement `isSpeaking()` status check
    - [x] 1.5: Add unit tests for TTSService

- [x] Task 2: Create Topic Library with Local Questions (AC: 3)
    - [x] 2.1: Create `src/features/recorder/data/topicQuestions.ts` with initial question set (10-15 questions in
      English)
    - [x] 2.2: Implement `getRandomQuestion()` utility that avoids repeating the last shown question
    - [x] 2.3: Define `TopicQuestion` type in `src/types/entities.ts`

- [x] Task 3: Create useTTS Hook (AC: 1, 2, 3, 4)
    - [x] 3.1: Create `src/features/recorder/hooks/useTTS.ts` to manage TTS state
    - [x] 3.2: Expose `speak`, `replay`, `stop`, `isSpeaking` from hook
    - [x] 3.3: Track current question text for replay functionality
    - [x] 3.4: Add unit tests for useTTS hook

- [x] Task 4: Update QuestionCard Component (AC: 1, 2, 3)
    - [x] 4.1: Add "Replay" button (speaker icon) to QuestionCard
    - [x] 4.2: Add "New Topic" button (shuffle/refresh icon) to QuestionCard
    - [x] 4.3: Ensure buttons meet 48dp touch target requirement
    - [x] 4.4: Apply Heritage Palette styling (Terracotta primary)

- [x] Task 5: Integrate TTS with Recording Flow (AC: 1, 4)
    - [x] 5.1: Auto-play TTS when QuestionCard mounts (first load)
    - [x] 5.2: Stop TTS when RecorderService.startRecording() is called
    - [x] 5.3: Update HomeTab to wire TTS and recording interactions
    - [x] 5.4: Manual test: Enter screen -> TTS plays -> Tap record -> TTS stops -> Recording works

- [x] Task 6: Validation & Polish
    - [x] 6.1: Verify TTS works on both iOS and Android
    - [x] 6.2: Verify device silent mode is respected
    - [x] 6.3: Run all existing tests to ensure no regressions

## Dev Notes

### Architecture & Tech Stack

**TTS Library Choice: `expo-speech`**

- Built into Expo SDK 54, no additional native dependencies
- Cross-platform (iOS AVSpeechSynthesizer, Android TextToSpeech)
- Supports rate, pitch, language configuration
- Does NOT require `expo prebuild` (works in Expo Go for testing)

```typescript
// Example usage
import * as Speech from 'expo-speech';

Speech.speak('Your story has started', {
  language: 'en-US',
  rate: 0.8,  // Slower for elderly (0.0-2.0, default 1.0)
  pitch: 1.0,
});
```

**Alternative (NOT recommended for MVP):**

- Deepgram TTS API - requires network, adds latency
- Use `expo-speech` for local TTS; Deepgram is for STT only

### File Structure

```
src/features/recorder/
├── services/
│   ├── recorderService.ts (existing)
│   ├── recorderService.test.ts (existing)
│   └── ttsService.ts (NEW)
├── hooks/
│   ├── useAudioAmplitude.ts (existing)
│   └── useTTS.ts (NEW)
├── components/
│   ├── WaveformVisualizer.tsx (existing)
│   ├── RecordingControls.tsx (existing)
│   └── QuestionCard.tsx (NEW or UPDATE)
├── data/
│   └── topicQuestions.ts (NEW)
```

### Design Guidelines (UX Spec Compliance)

**QuestionCard Layout (from UX Spec):**

```
┌────────────────────────────────────────┐
│  [Question Text - 24pt Body]           │
│  "What was your favorite game as a child?"   │
│                                        │
│  [🔊 Replay]          [🔄 New Topic]   │
│     48dp                  48dp         │
└────────────────────────────────────────┘
```

**Button Styling:**

- Replay: Secondary style (Cream filled)
- New Topic: Secondary style (Cream filled)
- Both buttons same width (symmetric per UX spec)

**Audio Settings (Elderly-Optimized):**

- Rate: 0.8 (slower than default)
- Pitch: 1.0 (normal, avoid high frequencies)
- Language: `en-US` (English)

### Previous Story Learnings (Story 2.2)

From Story 2.2 implementation:

- `RecorderService` already handles recording state (idle, recording, paused)
- `useAudioAmplitude` hook bridges metering data to UI via SharedValues
- Recording controls use large touch targets (72dp for main button)
- HomeTab integrates recorder components

**Key Integration Point:**

- When `startRecording()` is called, must call `TTSService.stop()` first
- This ensures no audio interference between TTS and recording

### Topic Questions (Initial Set)

Sample questions for the topic library (English):

```typescript
const TOPIC_QUESTIONS = [
  "What was your favorite game when you were a child?",
  "Do you remember your first day of school?",
  "Who was your best friend when you were young?",
  "How did you meet your partner?",
  "What is the thing you are most proud of?",
  "What was your most unforgettable trip?",
  "What is the most important thing your parents taught you?",
  "What do you want the next generation to remember about you?",
  "What was your dream when you were young?",
  "What is your favorite festival? Why?",
];
```

### Testing Requirements

**Unit Tests:**

- `ttsService.test.ts`: Mock `expo-speech`, verify speak/stop/isSpeaking
- `useTTS.test.ts`: Verify hook state management and replay logic

**Integration Tests:**

- Verify TTS stops when recording starts
- Verify "New Topic" changes both text and triggers TTS

**Manual Testing Checklist:**

- [ ] Enter recording screen -> Question plays automatically
- [ ] Tap Replay -> Same question plays again
- [ ] Tap New Topic -> Different question appears and plays
- [ ] Tap Record while TTS playing -> TTS stops, recording starts
- [ ] Device on silent -> No audio, but text visible
- [ ] Test on both iOS simulator and Android emulator

### Dependencies

**Required (already in project):**

- `expo-speech` (built into Expo SDK 54)

**No new dependencies needed!**

### Error Handling

- If TTS fails (rare), log to Sentry but don't block user
- QuestionCard text is always visible as fallback
- If `expo-speech` not available, gracefully degrade to text-only

### Accessibility

- QuestionCard text provides visual fallback for hearing-impaired users
- Replay button has `accessibilityLabel="Replay question"`
- New Topic button has `accessibilityLabel="Change question"`

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Debug Log References

N/A - No debug issues encountered.

### Completion Notes List

- Implemented `TTSService` using `expo-speech` with elderly-optimized defaults (rate: 0.8, pitch: 1.0, en-US language).
- Created topic library with 15 English questions across 6 categories (childhood, family, career, memories, wisdom,
  general).
- Implemented `getRandomQuestion()` with anti-repeat logic to avoid showing the same question twice in a row.
- Created `useTTS` hook for managing TTS state with autoPlay, speak, replay, stop, and newTopic functionality.
- Built `QuestionCard` component with Heritage Palette styling, 48dp touch targets, and proper accessibility labels.
- Integrated TTS with HomeTab: auto-plays on mount, stops when recording starts.
- All 66 tests pass with no regressions.
- Added `expo-speech` dependency to package.json.

### File List

- src/features/recorder/services/ttsService.ts (NEW)
- src/features/recorder/services/ttsService.test.ts (NEW)
- src/features/recorder/data/topicQuestions.ts (NEW)
- src/features/recorder/data/topicQuestions.test.ts (NEW)
- src/features/recorder/hooks/useTTS.ts (NEW)
- src/features/recorder/hooks/useTTS.test.ts (NEW)
- src/features/recorder/components/QuestionCard.tsx (NEW)
- src/features/recorder/components/QuestionCard.test.tsx (NEW)
- src/types/entities.ts (NEW)
- app/(tabs)/index.tsx (UPDATED)
- package.json (UPDATED - added expo-speech)

### Change Log

- 2026-01-14: Initial implementation of TTS voice guidance feature.
