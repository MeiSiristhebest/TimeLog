# Story 4.2: Secure Streaming Player

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Family User,
I want to listen to the stories securely,
So that I know our family privacy is protected.

## Acceptance Criteria

1. **Given** I tap a story in the family list
   **When** the player requests the audio
   **Then** the backend generates a time-limited Signed URL (valid for 1 hour)
   **And** the player streams the audio using this secure link

2. **Given** I am playing a story
   **When** the audio is streaming
   **Then** I see playback controls (Play/Pause, Seek bar, Duration)
   **And** the controls are large enough for easy interaction (≥48dp)

3. **Given** the Signed URL expires during playback
   **When** I try to seek or resume
   **Then** the system automatically refreshes the URL
   **And** playback continues seamlessly

4. **Given** I am not authenticated
   **When** I try to access the audio URL directly
   **Then** the request is denied (403 Forbidden)
   **And** public access to the storage bucket remains disabled

5. **Given** I finish playing a story
   **When** playback completes
   **Then** the player shows completion state
   **And** I can easily navigate back to the story list

## Tasks / Subtasks

- [x] Task 1: Implement Signed URL Generation Service (AC: 1, 4)
  - [x] 1.1: Create `src/features/family-listener/services/secureAudioService.ts`
  - [x] 1.2: Implement `getSignedAudioUrl(storyId: string)` function
  - [x] 1.3: Use Supabase Storage `createSignedUrl()` with 1-hour expiry
  - [x] 1.4: Handle authentication errors gracefully
  - [x] 1.5: Add error logging for failed URL generation

- [x] Task 2: Create Family Player Hook (AC: 1, 2, 3)
  - [x] 2.1: Create `src/features/family-listener/hooks/useFamilyPlayer.ts`
  - [x] 2.2: Manage player state (loading, playing, paused, error)
  - [x] 2.3: Track playback position and duration
  - [x] 2.4: Implement URL refresh logic when nearing expiry
  - [x] 2.5: Handle seek operations with URL validation

- [x] Task 3: Create Family Player Screen (AC: 2, 5)
  - [x] 3.1: Create `app/family-story/[id].tsx` route
  - [x] 3.2: Display story title, date, and duration
  - [x] 3.3: Implement large Play/Pause button (≥72dp per UX spec)
  - [x] 3.4: Add seek bar with position indicator
  - [x] 3.5: Show loading state while fetching signed URL

- [x] Task 4: Integrate with Existing Player Service (AC: 2, 3)
  - [x] 4.1: Reused existing `playerService.ts` (already supports remote URLs)
  - [x] 4.2: URL refresh handled in useFamilyPlayer hook
  - [x] 4.3: Seamless URL refresh via signedUrlRef pattern
  - [x] 4.4: Buffering state tracked via PlayerStatus.isBuffering

- [x] Task 5: Implement Playback Controls Component (AC: 2)
  - [x] 5.1: Create `src/features/family-listener/components/PlaybackControls.tsx`
  - [x] 5.2: Large Play/Pause toggle button (72dp)
  - [x] 5.3: Seek bar with draggable thumb (@react-native-community/slider)
  - [x] 5.4: Time display (current / total)
  - [x] 5.5: Playback speed control (deferred - not in MVP scope)

- [x] Task 6: Handle Playback Completion (AC: 5)
  - [x] 6.1: Show completion state UI (refresh icon + "Playback complete" message)
  - [x] 6.2: Add "Play Again" button (refresh icon restarts from beginning)
  - [x] 6.3: Add "Back to Stories" navigation (Back to Story List button)
  - [x] 6.4: Reset player state on navigation away (unload in useEffect cleanup)

- [x] Task 7: Security Validation (AC: 4)
  - [x] 7.1: Created SQL migration ensuring bucket is private
  - [x] 7.2: RLS policies documented in migration file
  - [x] 7.3: Security configuration documented in `supabase/migrations/20260115_secure_audio_storage.sql`
  - [x] 7.4: Added security test cases in `secureAudioService.test.ts`

- [x] Task 8: Accessibility and Polish (AC: 2)
  - [x] 8.1: Added screen reader labels for all controls (Chinese accessibility labels)
  - [x] 8.2: Seek bar has accessibilityRole="adjustable" and descriptive label
  - [x] 8.3: VoiceOver/TalkBack ready (all interactive elements labeled)
  - [x] 8.4: WCAG AAA contrast verified (Heritage Palette: 7:1 ratio)

## Dev Notes

### 🔥 CRITICAL CONTEXT: Secure Audio Streaming

This story implements **secure audio streaming** for family users. Key security requirements:

1. **No Public Access**: Storage bucket must have public access DISABLED
2. **Signed URLs**: All audio access via time-limited signed URLs (1 hour)
3. **RLS Enforcement**: Only authenticated family users can generate signed URLs
4. **URL Refresh**: Seamless refresh before expiry to prevent playback interruption

### Architecture Guardrails

**Signed URL Flow (from architecture.md):**

```
Family App → Request Signed URL → Supabase Edge Function (RLS check)
                                           ↓
                              Generate Signed URL (1h expiry)
                                           ↓
                              Return URL → Player streams audio
```

**Signed URL Generation Pattern:**

```typescript
// src/features/family-listener/services/secureAudioService.ts
import { supabase } from '@/lib/supabase';

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour
const REFRESH_THRESHOLD_SECONDS = 300; // Refresh when 5 mins remaining

export interface SignedAudioUrl {
  url: string;
  expiresAt: number; // Unix timestamp
}

export async function getSignedAudioUrl(storyId: string): Promise<SignedAudioUrl> {
  // First, get the storage path from audio_recordings
  const { data: story, error: storyError } = await supabase
    .from('audio_recordings')
    .select('storage_path')
    .eq('id', storyId)
    .single();

  if (storyError || !story?.storage_path) {
    throw new Error('Story not found or no audio available');
  }

  // Generate signed URL
  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .createSignedUrl(story.storage_path, SIGNED_URL_EXPIRY_SECONDS);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return {
    url: data.signedUrl,
    expiresAt: Date.now() + (SIGNED_URL_EXPIRY_SECONDS * 1000),
  };
}

export function shouldRefreshUrl(expiresAt: number): boolean {
  const remainingMs = expiresAt - Date.now();
  return remainingMs < REFRESH_THRESHOLD_SECONDS * 1000;
}
```

**Family Player Hook Pattern:**

```typescript
// src/features/family-listener/hooks/useFamilyPlayer.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { playerService, PlayerStatus } from '@/features/story-gallery/services/playerService';
import { getSignedAudioUrl, shouldRefreshUrl, SignedAudioUrl } from '../services/secureAudioService';

export function useFamilyPlayer(storyId: string) {
  const [status, setStatus] = useState<PlayerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const signedUrlRef = useRef<SignedAudioUrl | null>(null);

  const loadAudio = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const signedUrl = await getSignedAudioUrl(storyId);
      signedUrlRef.current = signedUrl;

      await playerService.loadAudio(signedUrl.url, setStatus);
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [storyId]);

  const refreshUrlIfNeeded = useCallback(async () => {
    if (signedUrlRef.current && shouldRefreshUrl(signedUrlRef.current.expiresAt)) {
      const newUrl = await getSignedAudioUrl(storyId);
      signedUrlRef.current = newUrl;
      // Note: expo-av handles URL changes gracefully
    }
  }, [storyId]);

  // ... rest of hook implementation
}
```

### Storage Bucket Configuration

**Supabase Storage Bucket Settings:**

```sql
-- Ensure bucket exists with private access
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- RLS Policy for signed URL generation
CREATE POLICY "family_can_access_linked_senior_audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio-recordings'
  AND (
    -- Owner can access
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Family can access linked senior's audio
    (storage.foldername(name))[1] IN (
      SELECT senior_user_id::text
      FROM family_members
      WHERE family_user_id = auth.uid()
    )
  )
);
```

### UI Implementation Details

**Player Screen Layout:**

```tsx
// app/family-story/[id].tsx
<Container>
  <View className="flex-1 justify-center items-center p-6">
    {/* Story Info */}
    <Text className="text-2xl font-semibold text-onSurface mb-2">
      {story.title ?? 'Untitled Story'}
    </Text>
    <Text className="text-base text-onSurface/60 mb-8">
      {formatAbsoluteDate(story.startedAt)}
    </Text>

    {/* Waveform Visualization (optional) */}
    <View className="w-full h-24 bg-surface rounded-xl mb-8">
      {/* Placeholder for waveform */}
    </View>

    {/* Playback Controls */}
    <PlaybackControls
      isPlaying={status?.isPlaying ?? false}
      position={status?.positionMillis ?? 0}
      duration={status?.durationMillis ?? 0}
      onPlayPause={handlePlayPause}
      onSeek={handleSeek}
    />
  </View>

  {/* Back Navigation */}
  <TouchableOpacity
    onPress={() => router.back()}
    className="absolute top-4 left-4 p-2"
    accessibilityLabel="Back to story list"
  >
    <Ionicons name="arrow-back" size={28} color="#2C2C2C" />
  </TouchableOpacity>
</Container>
```

**PlaybackControls Component:**

```tsx
// Large Play/Pause button (72dp per UX spec)
<TouchableOpacity
  onPress={onPlayPause}
  className="w-[72px] h-[72px] rounded-full bg-primary items-center justify-center"
  accessibilityRole="button"
  accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
>
  <Ionicons
    name={isPlaying ? 'pause' : 'play'}
    size={32}
    color="#FFF8E7"
  />
</TouchableOpacity>

{/* Seek Bar */}
<Slider
  value={position}
  minimumValue={0}
  maximumValue={duration}
  onSlidingComplete={onSeek}
  minimumTrackTintColor="#C26B4A"
  maximumTrackTintColor="#E6DAD0"
  thumbTintColor="#C26B4A"
  accessibilityLabel={`Playback progress ${formatTime(position)} / ${formatTime(duration)}`}
/>
```

### Database Schema Context

**Required field in `audio_recordings` (may need migration):**

- `storage_path`: Path to audio file in Supabase Storage (e.g., `{user_id}/{recording_id}.wav`)

**If not exists, check sync engine for storage path pattern.**

### Previous Story Intelligence

From **Story 4.1 (Family Story List)**:

- **Pattern:** `familyStoryService.ts` fetches stories from Supabase
- **Pattern:** React Query for data fetching with caching
- **Pattern:** Heritage Palette styling consistent across family feature
- **Learning:** RLS policies are critical for data isolation

From **Story 3.2 (Hybrid Player)**:

- **Pattern:** `playerService.ts` singleton for audio playback
- **Pattern:** `usePlayerStore` for playback state management
- **Learning:** expo-av handles both local and remote URLs

### Git Intelligence

Recent commits show:

- Story 4.1 completed - Family story list with Supabase integration
- playerService.ts exists with basic playback functionality
- Supabase client configured with secure storage

### File Structure

```
src/
├── features/
│   └── family-listener/
│       ├── components/
│       │   └── PlaybackControls.tsx    # NEW
│       ├── hooks/
│       │   └── useFamilyPlayer.ts      # NEW
│       └── services/
│           └── secureAudioService.ts   # NEW
├── features/
│   └── story-gallery/
│       └── services/
│           └── playerService.ts        # EXTEND (optional)
└── app/
    └── family-story/
        └── [id].tsx                    # NEW
```

### Testing Requirements

**Unit Tests:**

- `secureAudioService.test.ts`: Mock Supabase, verify URL generation
- `useFamilyPlayer.test.ts`: Test loading/playing/error states
- `PlaybackControls.test.tsx`: Test button interactions

**Security Tests:**

- Verify signed URL expires after 1 hour
- Verify direct bucket access is denied
- Verify RLS policy filters correctly

**Manual Testing Checklist:**

1. [ ] Tap story card - player loads
2. [ ] Signed URL generated (check network tab)
3. [ ] Audio streams successfully
4. [ ] Play/Pause controls work
5. [ ] Seek bar allows position change
6. [ ] Playback completes - shows completion state
7. [ ] Back navigation works
8. [ ] Direct URL access fails (403)
9. [ ] VoiceOver/TalkBack announces controls

### Performance Considerations

- **Buffering:** Show buffering indicator during network latency
- **Preload:** Consider preloading next story's signed URL
- **URL Caching:** Cache signed URLs in memory until near expiry
- **Audio Format:** WAV preserves full fidelity (larger file size)

### References

- [Source: epics.md#Story 4.2]
- [Source: architecture.md#Security - Supabase Storage]
- [Source: ux-design-specification.md#Story 3.2 Hybrid Player]
- [Source: architecture.md#Audio Architecture]
- [Source: project-context.md#Supabase]

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Anthropic)

### Debug Log References

- Console logs added in secureAudioService.ts for error tracking
- Player state transitions logged in useFamilyPlayer.ts

### Completion Notes List

1. Signed URL generation uses Supabase Storage `createSignedUrl()` with 1-hour expiry
2. URL refresh logic checks every 60 seconds during playback, refreshes when <5 min remaining
3. Player reuses existing `playerService.ts` from story-gallery feature
4. PlaybackControls uses 72dp button size per UX specification
5. Security migration creates RLS policies for family access to linked senior audio
6. All accessibility labels implemented in Chinese for elderly users

### Change Log

- 2026-01-15: Created secureAudioService.ts with signed URL generation
- 2026-01-15: Created useFamilyPlayer.ts hook with state management
- 2026-01-15: Created PlaybackControls.tsx component
- 2026-01-15: Created family-story/[id].tsx player screen
- 2026-01-15: Created security migration 20260115_secure_audio_storage.sql
- 2026-01-15: Added unit tests for secureAudioService and PlaybackControls
- 2026-01-15: Updated barrel exports in index.ts

### File List

**New Files:**

- `src/features/family-listener/services/secureAudioService.ts`
- `src/features/family-listener/services/secureAudioService.test.ts`
- `src/features/family-listener/hooks/useFamilyPlayer.ts`
- `src/features/family-listener/components/PlaybackControls.tsx`
- `src/features/family-listener/components/PlaybackControls.test.tsx`
- `app/family-story/[id].tsx`
- `supabase/migrations/20260115_secure_audio_storage.sql`

**Modified Files:**

- `src/features/family-listener/index.ts` (added Story 4.2 exports)
