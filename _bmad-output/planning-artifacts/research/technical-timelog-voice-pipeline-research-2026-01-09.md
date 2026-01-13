---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ['TimeLog_Proposal_text.txt']
workflowType: 'research'
lastStep: 4
research_type: 'technical'
research_topic: 'TimeLog Voice Pipeline Integration (LiveKit + Deepgram + Gemini)'
research_goals: 'Validate end-to-end latency < 2000ms, assess elderly speech recognition accuracy, verify React Native integration feasibility, identify integration risks'
user_name: 'Mei'
date: '2026-01-09'
web_research_enabled: true
source_verification: true
status: 'complete'
---

# Technical Research Report: TimeLog Voice Pipeline

**Date:** 2026-01-09
**Author:** Mei
**Research Type:** Technical

---

## Research Overview

This research investigates the technical feasibility of integrating LiveKit (WebRTC), Deepgram (STT), and Google Gemini (LLM) for TimeLog's voice-first mobile application targeting older adults.

---

## Step 1: Technical Research Scope Confirmation ✅

**Research Topic:** TimeLog Voice Pipeline Integration (LiveKit + Deepgram + Gemini)

**Research Goals:**
- Validate end-to-end latency < 2000ms (aligned with Table 3.2)
- Assess elderly speech recognition accuracy (aligned with Section 4.3.2)
- Verify React Native integration feasibility (aligned with Table 3.3)
- Identify integration risks

**Aligned Technology Stack (from Proposal Table 3.3):**

| Component | Technology | Research Focus |
|:----------|:-----------|:---------------|
| Transport | LiveKit (WebRTC) | Latency characteristics |
| STT/TTS | Deepgram | Elderly speech (≤120 wpm) |
| AI Logic | Gemini 3.0 Flash | TTFT performance |
| VAD | Silero VAD | On-device integration |
| Framework | React Native (Expo) | Compatibility |

**Latency Budget to Validate (from Proposal Table 3.2):**

| Stage | Budget (ms) |
|:------|:------------|
| On-device VAD | ~50 |
| Streaming STT | ~300-500 |
| LLM reasoning | ~400-700 |
| Streaming TTS | ~200-400 |
| Transport overhead | ~100-200 |
| **Total Target** | **< 2000** |

**Explicit Exclusions (Won't-Have):**
- ❌ Real-time emotion analysis
- ❌ Photo-based memory elicitation (CV)
- ❌ RAG-based personalization

**Scope Confirmed:** 2026-01-09

---

## Step 2: Technology Stack Analysis ✅

### 2.1 LiveKit (WebRTC Transport Layer)

**Overview:** LiveKit is a real-time communication platform built on WebRTC, using UDP for its media layer and a Selective Forwarding Unit (SFU) architecture.

**Latency Performance:**
| Metric | Value | Source |
|:-------|:------|:-------|
| Optimal network latency | sub-100ms | gethopp.app (Rust SDK example) |
| Poor network latency | ~160ms average | gethopp.app |
| Voice AI target response | ~236ms | LiveKit Agents SDK documentation |

**Key Features for TimeLog:**
- ✅ Streaming APIs for low-latency audio transport
- ✅ Asynchronous processing capabilities
- ✅ Intelligent retry logic for packet loss
- ✅ React Native SDK available

**React Native Integration:**
- Compatible with Expo via development builds and config plugins
- `@stream-io/react-native-webrtc` and `@config-plugins/react-native-webrtc` facilitate integration
- No need to "eject" from Expo

**Confidence Level:** [High] - Well-documented, production-proven platform

*Sources: livekit.io, gethopp.app, medium.com*

---

### 2.2 Deepgram (Speech-to-Text)

**Overview:** Deepgram provides ultra-low latency streaming STT using WebSocket connections, processing audio in small chunks (100-200ms).

**Latency Performance:**
| Metric | Value | Source |
|:-------|:------|:-------|
| End-of-word to transcription | <300ms | deepgram.com |
| First-word latency | ~150ms | deepgram.com |
| Chunk processing | 100-200ms | deepgram.com |

**Accuracy:**
- General accuracy: >90% for typical business audio
- Nova-2: 30% lower error rate than competitors
- Nova-3: Competitive Word Error Rates (WER)

**⚠️ Elderly Speech Recognition - RISK IDENTIFIED:**

| Challenge | Impact | Mitigation |
|:----------|:-------|:-----------|
| Slower articulation (≤120 wpm) | May cause premature cutoffs | Configure VAD pause thresholds |
| Imprecise consonants | Lower accuracy | Consider custom model training |
| Tremors and variability | Recognition errors | Real-time feedback adjustment |

> **Note:** Standard ASR systems are typically trained on speech from adults aged 20-60. Elderly speech (65+) presents unique challenges. Deepgram claims handling of diverse accents but does not publish specific elderly speech benchmarks.

**Confidence Level:** [Medium] - General performance is excellent; elderly-specific accuracy requires validation

*Sources: deepgram.com, researchgate.net, nih.gov*

---

### 2.3 Google Gemini 3.0 Flash (LLM)

**Overview:** Gemini 3.0 Flash is optimized for high-speed, high-volume tasks with low latency. It was "distilled" from Gemini Pro for efficiency.

**Latency Performance:**
| Metric | Value | Source |
|:-------|:------|:-------|
| Time to First Token (TTFT) | sub-second | Google (infoq.com) |
| Typical response time | <1.2 seconds | ailatency.com |
| Sept 2024 optimization | 2x faster output, 3x lower latency | googleblog.com |

**Key Features:**
- 1 million token context window (default)
- Ideal for: summarization, chat, captioning, data extraction
- Streaming API support for reduced perceived latency

**Confidence Level:** [High] - Well-documented, recent optimizations confirmed

*Sources: Google blog, infoq.com, ailatency.com*

---

### 2.4 Silero VAD (Voice Activity Detection)

**Overview:** Silero VAD is a lightweight, high-performance model optimized for IoT, edge, and mobile use cases. Supports ONNX runtime.

**Primary Solution (User's Architecture):**

```bash
pip install livekit-plugins-silero
```

| Component | Location | Purpose |
|:----------|:---------|:--------|
| `livekit-plugins-silero` | Python Agent (Backend) | ✅ **Primary VAD** - Deep integration with LiveKit Agents |
| `expo-audio-studio` | React Native (Client) | ⚪ Optional - Pre-filtering for offline scenarios |

**Dual VAD Strategy (Recommended):**

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (Optional)                                               │
│  expo-audio-studio → Local pre-detection (offline fallback)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER (Primary)                                                │
│  livekit-plugins-silero → Final VAD decision in Agent pipeline │
└─────────────────────────────────────────────────────────────────┘
```

**Agent Configuration (Python):**

```python
from livekit.agents import AgentSession
from livekit.plugins import silero, deepgram, google

session = AgentSession(
    vad=silero.VAD(),
    stt=deepgram.STTv2(model="nova-3"),
    llm=google.LLM(model="gemini-1.5-flash"),
    tts=deepgram.TTS(model="aura-asteria-en")
)
```

**Confidence Level:** [High] - User's architecture aligns with LiveKit best practices

*Sources: livekit.io, pypi.org (livekit-plugins-silero), npmjs.com (expo-audio-studio)*

---

### 2.5 End-to-End Pipeline Latency Analysis

**Production Voice AI Targets:**
- Human inter-turn gap: ~200ms
- Unnatural delay threshold: >500-1000ms
- **Production target: <800ms total latency**

**TimeLog Proposal Target: <2000ms** (more conservative)

**Estimated Latency Budget (Aligned with Proposal Table 3.2):**

| Component | Proposal Budget | Research Finding | Status |
|:----------|:----------------|:-----------------|:-------|
| On-device VAD | ~50ms | Silero: <50ms | ✅ Achievable |
| Streaming STT | ~300-500ms | Deepgram: 150-300ms | ✅ Within budget |
| LLM reasoning | ~400-700ms | Gemini Flash: <1000ms TTFT | ⚠️ At upper bound |
| Streaming TTS | ~200-400ms | Deepgram Aura: ~200ms | ✅ Achievable |
| Transport overhead | ~100-200ms | LiveKit: <100ms optimal | ✅ Achievable |
| **Total** | **<2000ms** | **~800-1600ms estimated** | ✅ **Feasible** |

**Optimization Strategies Identified:**
1. Use streaming APIs for all components (STT, LLM, TTS)
2. Prompt engineering for shorter LLM responses
3. Semantic caching for frequently asked questions
4. Warm-up queries during connection establishment
5. Regional deployment to minimize network hops

---

### 2.6 React Native + Expo + LiveKit Integration

**Status:** ✅ Fully compatible in 2024

**Official LiveKit React Native SDK:**

```bash
# Installation
npm install @livekit/react-native @livekit/react-native-webrtc

# Expo Config Plugin (app.json or app.config.js)
{
  "plugins": [
    "@livekit/react-native-webrtc"
  ]
}
```

**SDK Architecture:**
```
LiveKit React Native
├── @livekit/react-native          # Official LiveKit SDK
├── @livekit/react-native-webrtc   # LiveKit's WebRTC wrapper
└── react-native-webrtc            # Underlying WebRTC (auto-installed)
```

**Why LiveKit SDK (not generic WebRTC):**

| LiveKit SDK | Generic WebRTC |
|:------------|:---------------|
| ✅ Built-in Agents SDK for Voice AI | ❌ Manual pipeline setup |
| ✅ Optimized for STT+LLM+TTS flow | ❌ No AI integration |
| ✅ ~236ms response target | ❌ No latency optimization |
| ✅ Intelligent packet loss retry | ❌ Manual error handling |

**Performance Best Practices:**
| Practice | Benefit |
|:---------|:--------|
| Enable Hermes engine | Faster JS execution |
| New Architecture (TurboModules) | Reduced bridge overhead |
| Use Expo Development Build | Required for native modules |
| Bandwidth management | Adaptive quality |

**Confidence Level:** [High] - Official SDK with Expo support

*Sources: livekit.io, docs.livekit.io, github.com/livekit/client-sdk-react-native*

---

### 2.7 Research Summary - Step 2

| Technology | Feasibility | Confidence | Key Risk |
|:-----------|:------------|:-----------|:---------|
| LiveKit | ✅ Excellent | High | Cloud deployment latency |
| Deepgram | ✅ Good | Medium | Elderly speech accuracy |
| Gemini Flash | ✅ Good | High | LLM at upper latency bound |
| Silero VAD | ✅ Excellent | High | None identified |
| Expo Integration | ✅ Good | High | Dev build required |

**Overall Assessment:** The technology stack is **technically feasible** for the <2000ms target. The primary risk is **elderly speech recognition accuracy** with Deepgram, which requires validation during pilot testing.

---

## Step 3: Integration Patterns Analysis ✅

### 3.1 System Architecture Overview

**TimeLog employs a 3-tier architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 1: Mobile Client                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React Native (Expo)                                     │   │
│  │  ├── @livekit/react-native (Audio streaming)            │   │
│  │  ├── expo-audio-studio (VAD)                            │   │
│  │  ├── SQLite + Drizzle ORM (Local persistence)           │   │
│  │  └── Network monitor (Mode switching)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebRTC (Audio Track)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 2: LiveKit SFU                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LiveKit Cloud / Self-hosted                             │   │
│  │  ├── Room management                                     │   │
│  │  ├── Participant routing                                │   │
│  │  └── Media forwarding (no transcoding)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Audio Track Subscription
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TIER 3: Voice Agent (Python)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  LiveKit Agents SDK                                      │   │
│  │  ├── silero.VAD() (Voice Activity Detection)            │   │
│  │  ├── deepgram.STTv2() (Speech-to-Text)                  │   │
│  │  ├── google.LLM() (Gemini Language Model)               │   │
│  │  └── deepgram.TTS() (Text-to-Speech)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Confidence Level:** [High] - Well-documented, production-proven architecture

*Sources: livekit.io, medium.com, github.com/livekit*

---

### 3.2 LiveKit Agents SDK Integration

**Official Plugin Installation:**

```bash
pip install livekit-agents livekit-plugins-silero livekit-plugins-deepgram livekit-plugins-google
```

**Environment Variables Required:**

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
DEEPGRAM_API_KEY=your-deepgram-key
GOOGLE_API_KEY=your-google-key  # For Gemini
```

**Agent Session Configuration (Python):**

```python
from livekit.agents import AgentSession
from livekit.plugins import silero, deepgram, google

session = AgentSession(
    vad=silero.VAD(),
    stt=deepgram.STTv2(
        model="nova-3",
        language="zh-CN",  # Chinese support
        smart_format=True,
        punctuate=True
    ),
    llm=google.LLM(
        model="gemini-1.5-flash",
        temperature=0.7
    ),
    tts=deepgram.TTS(
        model="aura-asteria-en"
    )
)
```

**Elderly Speech Adaptations:**

| Setting | Purpose | Recommended Value |
|:--------|:--------|:------------------|
| `eager_eot_threshold` | End-of-turn tolerance | Increase for slower speech |
| `turn_detection="stt"` | Use Deepgram's phrase endpointing | Recommended |
| Pause threshold | Handle ≤120 wpm speech | 2-3 seconds |

**Confidence Level:** [High] - Official documentation with code examples

*Sources: livekit.io, pypi.org (livekit-plugins-deepgram)*

---

### 3.3 React Native Client Integration

**Data Flow:**

```
1. User speaks → Microphone capture
2. Audio → @livekit/react-native → WebRTC track
3. Track → LiveKit Room (subscription)
4. Agent receives → STT → LLM → TTS
5. Agent publishes → TTS audio track
6. Client receives → Speaker playback
```

**Token Server Requirement:**

The React Native client must obtain a JWT access token from a backend server before connecting to LiveKit:

```typescript
// Token request from React Native
const response = await fetch('https://your-server.com/api/token', {
  method: 'POST',
  body: JSON.stringify({ roomName, participantName })
});
const { token } = await response.json();

// Connect to LiveKit room
await room.connect(LIVEKIT_URL, token);
```

**Starter Template Available:**

```bash
# LiveKit provides an official React Native + Expo starter
gh repo clone livekit-examples/agent-starter-react-native
```

**Confidence Level:** [High] - Official starter template available

*Sources: github.com/livekit-examples, npmjs.com (@livekit/react-native)*

---

### 3.4 Offline-First / Local-First Integration Pattern

**TimeLog's Graceful Degradation Strategy (Aligned with Proposal Section 3.5):**

```
┌─────────────────────────────────────────────────────────────────┐
│                    NETWORK STATUS MONITOR                       │
│                                                                  │
│  Network Quality Check (every 500ms)                            │
│  ├── RTT < 500ms + Packet Loss < 5% → ONLINE MODE              │
│  │   └── Enable: STT + LLM + TTS (Full AI pipeline)            │
│  │                                                               │
│  └── 3 consecutive failures in 2s → OFFLINE MODE               │
│      └── Trigger: Sound Cue + Local-only recording             │
└─────────────────────────────────────────────────────────────────┘
```

**Mode Switching Implementation:**

| Mode | Trigger | Behavior |
|:-----|:--------|:---------|
| **ONLINE** | Stable connection | STT → LLM → TTS active |
| **OFFLINE** | 3 failed probes / 2s | Sound Cue + local recording only |
| **RECOVERY** | Connection restored | Background sync of queued recordings |

**Local-First Data Pattern:**

```typescript
// Local-first pseudo-code
const saveRecording = async (audio: Blob) => {
  // 1. ALWAYS save locally first
  await localDB.recordings.insert({
    id: uuid(),
    audio: audio,
    syncStatus: 'pending',
    createdAt: Date.now()
  });
  
  // 2. Queue for background sync
  syncQueue.add(recordingId);
  
  // 3. Sync when online (non-blocking)
  if (isOnline) {
    backgroundSync.trigger();
  }
};
```

**Conflict Resolution Strategy:**

| Scenario | Resolution |
|:---------|:-----------|
| Same recording modified | Last-write-wins (timestamp-based) |
| Sync failure | Retry with exponential backoff |
| Permanent sync failure | Keep local, mark for manual review |

**Confidence Level:** [High] - Pattern aligns with Proposal Section 3.5

*Sources: medium.com, dev.to (offline-first patterns)*

---

### 3.5 API Communication Patterns

**WebSocket for Real-time:**

| Component | Protocol | Purpose |
|:----------|:---------|:--------|
| LiveKit | WebRTC (UDP) | Audio streaming |
| Deepgram STT | WebSocket | Streaming transcription |
| Gemini | HTTPS (Streaming) | LLM inference |
| Supabase | WebSocket | Real-time sync |

**Security Patterns:**

| Pattern | Implementation |
|:--------|:---------------|
| Authentication | JWT tokens (LiveKit, Supabase) |
| API Keys | Environment variables (never client-side) |
| Data encryption | TLS 1.3 in transit, SQLCipher at rest |
| Privacy | Deepgram ephemeral processing (no retention) |

**Confidence Level:** [High] - Standard patterns

---

### 3.6 Research Summary - Step 3

| Integration Area | Pattern | Confidence |
|:-----------------|:--------|:-----------|
| Client-Server | 3-tier (RN → SFU → Agent) | High |
| Voice AI Pipeline | LiveKit Agents SDK + Plugins | High |
| Offline Fallback | Local-first + Sound Cue | High |
| Data Sync | SQLite + Supabase background sync | High |
| Security | JWT + TLS + SQLCipher | High |

**Key Integration Decisions for TimeLog:**

1. ✅ Use LiveKit Agents SDK (Python) for backend voice processing
2. ✅ Use @livekit/react-native for client audio streaming
3. ✅ Implement local-first with Sound Cue for graceful degradation
4. ✅ Use expo-audio-studio for on-device VAD
5. ⚠️ Token server required for authentication (Node.js or Python)

---

## Step 4: Conclusions & Recommendations ✅

### 4.1 Executive Summary

**Research Question:** Is the LiveKit + Deepgram + Gemini technology stack technically feasible for TimeLog's voice-first application targeting older adults, with an end-to-end latency target of <2000ms?

**Answer: ✅ YES - Technically Feasible with Medium Risk**

| Criterion | Target | Research Finding | Verdict |
|:----------|:-------|:-----------------|:--------|
| End-to-end latency | <2000ms | 800-1600ms estimated | ✅ Pass |
| React Native/Expo compatibility | Required | Official LiveKit SDK + Expo config plugins | ✅ Pass |
| Offline fallback | Required | Local-first + Sound Cue pattern | ✅ Pass |
| On-device VAD | Required | expo-audio-studio (Silero VAD) | ✅ Pass |
| Elderly speech recognition | Required | Deepgram general: >90%, elderly: unverified | ⚠️ Medium Risk |

---

### 4.2 Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|:-----|:---------|:-----------|:-----------|
| **Elderly speech recognition accuracy** | 🔴 High | Medium | Conduct pilot testing with 5+ elderly users; tune `eager_eot_threshold` |
| LLM latency at upper bound | 🟡 Medium | Low | Use prompt engineering for shorter responses; semantic caching |
| LiveKit Cloud regional latency | 🟡 Medium | Low | Deploy in Asia-Pacific region; use warm-up queries |
| Token server additional component | 🟢 Low | High | Use LiveKit's token server examples (Node.js/Python) |
| Expo Dev Build required | 🟢 Low | High | Expected; documented in setup guide |

---

### 4.3 Recommendations

#### 🔴 Must Do (Before MVP)

1. **Conduct LiveKit + Deepgram + Gemini PoC Spike**
   - Build minimal voice agent in first week
   - Measure actual end-to-end latency distribution (P50, P95)
   - Validate with simulated elderly speech patterns

2. **Tune Deepgram for Elderly Speech**
   - Increase `eager_eot_threshold` for slower speech (≤120 wpm)
   - Set `turn_detection="stt"` for Deepgram's phrase endpointing
   - Consider pause threshold of 2-3 seconds

3. **Implement Token Server**
   - Required for LiveKit authentication
   - Use LiveKit's official Node.js or Python examples
   - Can be serverless (Supabase Edge Functions)

#### 🟡 Should Do (During MVP)

4. **Regional Deployment**
   - Use LiveKit Cloud Asia-Pacific region
   - Configure Deepgram and Gemini for regional endpoints

5. **Prompt Engineering**
   - Craft prompts for shorter, more concise LLM responses
   - Reduces TTS generation time

6. **Implement Semantic Caching**
   - Cache responses for frequently asked topic questions
   - Reduces LLM calls and latency

#### 🟢 Nice to Have (Post-MVP)

7. **Custom Deepgram Model**
   - If pilot testing reveals significant accuracy issues with elderly speech
   - Deepgram offers custom model training

---

### 4.4 Validated Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE CLIENT (React Native + Expo)          │
│  npm install @livekit/react-native @livekit/react-native-webrtc│
│  npm install expo-audio-studio                                  │
│  npm install drizzle-orm expo-sqlite                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LIVEKIT CLOUD (SFU)                          │
│  - Asia-Pacific region recommended                              │
│  - Managed service (no infrastructure)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE AGENT (Python)                         │
│  pip install livekit-agents                                     │
│  pip install livekit-plugins-deepgram                           │
│  pip install livekit-plugins-google                             │
│                                                                  │
│  AgentSession(                                                   │
│    stt=deepgram.STTv2(model="nova-3"),                          │
│    llm=google.LLM(model="gemini-1.5-flash"),                    │
│    tts=deepgram.TTS(model="aura-asteria-en")                    │
│  )                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Research Confidence Summary

| Research Area | Sources | Confidence |
|:--------------|:--------|:-----------|
| LiveKit latency & architecture | livekit.io, gethopp.app, medium.com | High |
| Deepgram STT/TTS performance | deepgram.com, pypi.org | High |
| Deepgram elderly speech | researchgate.net, nih.gov | Low (no direct benchmarks) |
| Gemini Flash latency | Google blog, ailatency.com | High |
| Silero VAD / expo-audio-studio | npmjs.com, github.com | High |
| Offline-first patterns | medium.com, dev.to | High |
| React Native + Expo + WebRTC | expo.dev, daily.co, livekit.io | High |

---

### 4.6 Next Steps

1. ✅ **Research Complete** - Proceed to Product Brief Workflow
2. Create PRD with validated technology constraints
3. Design UX with offline mode considerations
4. Create Architecture Document with 3-tier pattern
5. Plan PoC Spike for Week 1 of implementation

---

## Appendix: Source URLs

### LiveKit
- https://livekit.io
- https://docs.livekit.io
- https://github.com/livekit/client-sdk-react-native

### Deepgram
- https://deepgram.com
- https://pypi.org/project/livekit-plugins-deepgram

### Gemini
- https://blog.google (Gemini announcements)
- https://infoq.com (Gemini 3.0 Flash analysis)

### Research
- https://researchgate.net (Elderly speech ASR)
- https://nih.gov (Aging voice characteristics)

---

**Research Complete: 2026-01-09**
**Author: Mei**
**Status: ✅ Complete**
