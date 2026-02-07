# H2 Implementation Plan: AI Dialog with LiveKit

> **Status**: Investigation Complete | **Architecture**: Dual Audio Path (Revised)

## Executive Summary

**Key Finding**: LiveKit React Native SDK does NOT support publishing custom audio tracks from external PCM sources. The SDK only supports device microphone access via `setMicrophoneEnabled(true)`. This forces us to use a **Dual Audio Path** architecture.

## Revised Architecture

### Dual Audio Path Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React Native)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Path 1: Local Recording (Offline-First, Never Fails)                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ @siteed      │───▶│ Local WAV    │───▶│ SQLite       │                  │
│  │ Audio Studio │    │ File         │    │ Metadata     │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                     │                       │
│                                                     ▼                       │
│                                              ┌──────────────┐              │
│                                              │ Sync Queue   │              │
│                                              │ (when online)│              │
│                                              └──────────────┘              │
│                                                                             │
│  Path 2: LiveKit Streaming (Online Only, Dialog Mode)                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │ LiveKit SDK  │───▶│ LiveKit      │───▶│ Python Agent │                  │
│  │ Microphone   │    │ SFU          │    │ (Cloud)      │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                                                     │                       │
│                              ┌──────────────────────┼──────────────────┐   │
│                              ▼                      ▼                  ▼   │
│                       ┌──────────┐           ┌──────────┐        ┌────────┐ │
│                       │ STT      │           │ Gemini   │        │ TTS    │ │
│                       │ Deepgram │           │ Flash 3.0│        │Deepgram│ │
│                       └──────────┘           └──────────┘        └────────┘ │
│                                                                             │
│                              ┌────────────────────────────────────────┐    │
│                              ▼                                        ▼    │
│                       ┌──────────┐                             ┌────────┐  │
│                       │ Agent    │────────────────────────────▶│ Client │  │
│                       │ Audio    │   (WebRTC Audio Track)      │ Audio  │  │
│                       └──────────┘                             └────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Dual Path?

1. **Elderly-First**: Recording must NEVER be blocked by network issues
2. **Local-First**: WAV file is primary artifact; AI dialog is enhancement
3. **LiveKit Limitation**: Cannot inject external PCM into LiveKit audio track
4. **Redundancy**: Two independent audio sources ensure no data loss

### Data Flow

```
User Speaks
     │
     ├────────────────────────────────────────┐
     │                                        │
     ▼                                        ▼
@siteed (local)                    LiveKit SDK (mic)
     │                                        │
     ▼                                        ▼
Local WAV File                     LiveKit SFU ──▶ Python Agent
     │                                        │
     ▼                                        ▼
SQLite (metadata)                  Deepgram STT ──▶ Gemini LLM
     │                                        │
     ▼                                        ▼
Sync Queue (when online)           Deepgram TTS (emotional voice)
                                         │
                                         ▼
                                   LiveKit Audio Track
                                         │
                                         ▼
                                   Client Playback (Agent Voice)
```

## State Machine: Dialog Modes

```
                    ┌──────────────────┐
                    │   IDLE/STARTUP   │
                    └─────────┬────────┘
                              │
                              ▼
                    ┌──────────────────┐
          ┌────────▶│   DIALOG MODE    │◀────────┐
          │         │  (Online + AI)   │         │
          │         └─────────┬────────┘         │
          │                   │                   │
          │   ┌───────────────┼───────────────┐   │
          │   ▼               ▼               ▼   │
          │  Timeout      Network Fail    User Skip
          │   │               │               │   │
          │   ▼               ▼               ▼   │
          │  ┌──────────────────────────────────┐ │
          │  │      DEGRADED/SILENT MODE        │ │
          └──│   (No AI, Local Recording Only)  │─┘
             └──────────────────────────────────┘
                              │
                              ▼
                    Network Recovers
                              │
                              ▼
                    ┌──────────────────┐
                    │  RETRY DIALOG?   │
                    │  (User Prompt)   │
                    └─────────┬────────┘
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
              Yes (Continue)        No (Stay Silent)
                   │                     │
                   ▼                     ▼
            ┌──────────┐           ┌──────────┐
            │ DIALOG   │           │ SILENT   │
            └──────────┘           └──────────┘
```

### State Definitions

| State | Description | Triggers |
|-------|-------------|----------|
| **DIALOG** | Full AI dialog mode with real-time streaming | Network OK, LiveKit connected, Agent responding |
| **DEGRADED** | Network quality poor, 2000ms timeout hit | Timeout >2000ms, packet loss >5%, jitter >100ms |
| **SILENT** | No AI, only local recording | User skipped 2x, or manually disabled AI |

### Timeout & Skip Logic

```typescript
// 2000ms timeout rule
const AI_RESPONSE_TIMEOUT = 2000; // ms

// 2x skip rule
let skipCount = 0;
const MAX_SKIPS_BEFORE_SILENT = 2;

function onUserSkip() {
  skipCount++;
  if (skipCount >= MAX_SKIPS_BEFORE_SILENT) {
    transitionToSilentMode();
  }
}

function onAiResponse() {
  skipCount = 0; // Reset on successful response
}

// Timeout handling
function startResponseTimer() {
  setTimeout(() => {
    if (!hasAiResponse) {
      transitionToDegradedMode();
    }
  }, AI_RESPONSE_TIMEOUT);
}
```

## Component Architecture

### Core Services

```typescript
// 1. LiveKitClient.ts - Wrapper for LiveKit connection
class LiveKitClient {
  private room: Room;
  private token: string;
  
  async connect(token: string): Promise<void>;
  async enableMicrophone(): Promise<void>;
  async subscribeToAgentAudio(callback: (track: RemoteAudioTrack) => void): void;
  async subscribeToTranscription(callback: (text: string) => void): void;
}

// 2. LiveKitTokenService.ts - Fetch JWT from Supabase
class LiveKitTokenService {
  async fetchToken(roomName: string): Promise<string>;
  async refreshToken(): Promise<string>;
}

// 3. AiDialogOrchestrator.ts - State machine
class AiDialogOrchestrator {
  private mode: 'DIALOG' | 'DEGRADED' | 'SILENT';
  private networkQuality: NetworkQuality;
  
  async startSession(): Promise<void>;
  async handleSkip(): Promise<void>;
  async handleTimeout(): Promise<void>;
  onModeChange(callback: (mode: DialogMode) => void): void;
}

// 4. NetworkQualityService.ts - Probe-based quality detection
class NetworkQualityService {
  private rtt: number;
  private packetLoss: number;
  private jitter: number;
  
  async startProbing(): Promise<void>;
  getQuality(): NetworkQuality;
  onQualityChange(callback: (quality: NetworkQuality) => void): void;
}

// 5. TranscriptSyncService.ts - Persist transcripts
class TranscriptSyncService {
  async saveTranscriptSegment(segment: TranscriptSegment): Promise<void>;
  async syncToSupabase(): Promise<void>;
  async getTranscriptForStory(storyId: string): Promise<TranscriptSegment[]>;
}
```

### UI Components

```typescript
// ActiveRecordingView additions
interface ActiveRecordingViewProps {
  // Existing...
  
  // H2 Additions
  aiMode: 'DIALOG' | 'DEGRADED' | 'SILENT';
  networkQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  liveTranscript: string;
  onSkipPress: () => void;
  onContinuePress: () => void;
}

// ConnectivityBadge.tsx
const ConnectivityBadge: React.FC<{
  quality: NetworkQuality;
  mode: DialogMode;
}> = ({ quality, mode }) => {
  // Green/Red indicator with sound cues
};
```

## Database Schema

### New Tables

```sql
-- Transcript segments (local-first)
CREATE TABLE transcript_segments (
    id TEXT PRIMARY KEY,           -- UUID v7
    story_id TEXT NOT NULL,        -- FK to stories
    segment_index INTEGER NOT NULL,-- Ordering
    speaker TEXT NOT NULL,         -- 'user' | 'agent'
    text TEXT NOT NULL,
    confidence REAL,               -- STT confidence (0-1)
    start_time_ms INTEGER,         -- Relative to recording start
    end_time_ms INTEGER,
    is_final BOOLEAN DEFAULT false,-- Final vs interim
    synced_at TIMESTAMP,           -- When synced to Supabase
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI dialog sessions
CREATE TABLE dialog_sessions (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    livekit_room_name TEXT,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    mode TEXT,                     -- 'DIALOG' | 'DEGRADED' | 'SILENT'
    skip_count INTEGER DEFAULT 0,
    timeout_count INTEGER DEFAULT 0
);

-- Network quality logs (diagnostics, no PII)
CREATE TABLE network_quality_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    timestamp TIMESTAMP,
    rtt_ms INTEGER,
    packet_loss_percent REAL,
    jitter_ms INTEGER,
    quality_score TEXT             -- 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
);
```

## API Contracts

### Supabase Edge Functions

```typescript
// 1. livekit-token (POST /functions/v1/livekit-token)
interface LiveKitTokenRequest {
  room_name: string;
  identity: string;           // user_id
}

interface LiveKitTokenResponse {
  token: string;
  url: string;                // LiveKit WS URL
  expires_at: number;         // Unix timestamp
}

// 2. network-probe (GET /functions/v1/network-probe)
interface NetworkProbeResponse {
  timestamp: number;
  server_region: string;
  // Lightweight probe for RTT calculation
}
```

### LiveKit Agent (Python)

```python
# Agent configuration
@agents.room.on("track_subscribed")
async def on_track_subscribed(track: rtc.Track, ...):
    if track.kind == rtc.TrackKind.KIND_AUDIO:
        # 1. Silero VAD for elderly-tuned speech detection
        # 2. Deepgram Nova-3 STT (multi-language)
        # 3. Gemini Flash 3.0 for dialog management
        # 4. Deepgram Aura TTS (emotional voice)
        pass

# Transcription forwarding
async def forward_transcription(text: str, is_final: bool):
    # Send via lk.transcription text stream
    await room.local_participant.publish_text_stream(
        text,
        {"type": "transcription", "final": str(is_final)}
    )
```

## Implementation Checklist

### Phase 0: Setup & Dependencies

- [ ] Install `@livekit/react-native` + `@livekit/react-native-expo-plugin` + `livekit-client`
- [ ] Configure `app.json` with LiveKit plugin
- [ ] Update AndroidManifest.xml (permissions)
- [ ] Update Info.plist (permissions)
- [ ] Verify `registerGlobals()` setup

### Phase 1: LiveKit Infrastructure

- [ ] Create `src/lib/livekit/LiveKitClient.ts`
  - Room connection management
  - Token refresh logic
  - Event listeners (TrackSubscribed, Disconnected, etc.)
- [ ] Create `src/features/recorder/services/livekitTokenService.ts`
  - Supabase Edge Function integration
  - Token caching
- [ ] Create `src/lib/livekit/audioSession.ts`
  - AudioSession configuration
  - `AudioSession.startAudioSession()` / `stopAudioSession()`

### Phase 2: Dialog Orchestrator

- [ ] Create `src/features/recorder/services/aiDialogOrchestrator.ts`
  - State machine (DIALOG/DEGRADED/SILENT)
  - Mode transitions
  - Timeout handling (2000ms)
  - Skip counter (2x rule)
- [ ] Create `src/features/recorder/services/networkQualityService.ts`
  - RTT probing
  - Quality metrics calculation
  - Quality change events
- [ ] Create `src/features/recorder/services/transcriptSyncService.ts`
  - SQLite persistence
  - Supabase sync

### Phase 3: UI Integration

- [ ] Update `ActiveRecordingView.tsx`
  - Add AI dialog UI elements
  - Live transcript display
  - Skip/Continue buttons
  - Connectivity badge
- [ ] Create `ConnectivityBadge.tsx`
  - Green/Red indicator
  - Accessibility labels
  - Sound cues (<100ms)
- [ ] Create `LiveTranscriptPanel.tsx`
  - Scrollable transcript view
  - Speaker identification (user/agent)

### Phase 4: Database & Sync

- [ ] Create Drizzle schema for `transcript_segments`
- [ ] Create Drizzle schema for `dialog_sessions`
- [ ] Create Drizzle schema for `network_quality_logs`
- [ ] Run `drizzle-kit generate`
- [ ] Implement TranscriptSyncService with offline queue

### Phase 5: Python Agent

- [ ] Create `agents/timelog_agent.py`
  - Silero VAD (elderly-tuned: 3-5s pause)
  - Deepgram Nova-3 STT
  - Gemini Flash 3.0 prompt engineering
  - Deepgram Aura TTS
  - lk.transcription forwarding
- [ ] Create `agents/Dockerfile`
- [ ] Deploy to LiveKit Cloud

### Phase 6: Testing

- [ ] Unit tests: State machine transitions
- [ ] Unit tests: Network quality calculation
- [ ] Integration tests: LiveKit connection lifecycle
- [ ] E2E tests: Full dialog flow (online)
- [ ] E2E tests: Degraded mode (throttled network)
- [ ] E2E tests: Silent mode (offline)
- [ ] Accessibility audit: Voice-first navigation

## Technical Constraints

### Audio Format Requirements

| Component | Format | Sample Rate | Channels |
|-----------|--------|-------------|----------|
| @siteed (local) | WAV | 16kHz | Mono |
| LiveKit (mic) | Opus | 48kHz | Mono (SDK handles) |
| Agent STT Input | PCM/Opus | 48kHz | Mono |
| Agent TTS Output | PCM | 48kHz | Mono |
| Client Playback | Opus | 48kHz | Mono |

### Free Tier Limits (LiveKit Cloud)

- **Agent Minutes**: 1,000/month (~16.6 hours)
- **Inference Credits**: $2.50/month (STT + TTS + LLM)
- **Concurrent Agents**: 5 max
- **Egress**: $0.18/GB (recording)

### Critical Rules

1. **NEVER** log transcripts or PII to Sentry
2. **ALWAYS** check disk space before recording (≥500MB)
3. **NEVER** block local recording for network issues
4. **ALWAYS** use `expo-secure-store` for LiveKit tokens
5. **NEVER** commit API secrets to repo

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dual audio path conflicts | Medium | Separate permissions, different audio sources |
| LiveKit SDK breaking changes | Low | Pin versions, test on upgrades |
| Free tier limits exceeded | Low | Monitor usage, add alerts |
| STT accuracy with elderly speech | Medium | Elderly-tuned VAD (3-5s pause), Nova-3 model |
| Network quality false positives | Medium | Smoothing algorithm, multiple probes |

## Success Criteria

- [ ] Elder can record story offline without AI interference
- [ ] When online, AI responds within 2000ms 95% of the time
- [ ] Skip/Continue works with 2x skip → Silent mode
- [ ] Connectivity badge shows green <100ms after quality change
- [ ] Transcript syncs to Supabase within 5 seconds of recording end
- [ ] All tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)

---

**Next Steps**: Begin Phase 0 - Install dependencies and configure LiveKit SDK
