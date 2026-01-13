---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - prd.md
  - product-brief-TimeLog-2026-01-09.md
  - research/technical-timelog-voice-pipeline-research-2026-01-09.md
  - ux-design-specification.md
workflowType: 'architecture'
project_name: 'TimeLog'
user_name: 'Mei'
date: '2026-01-09T15:00:07+07:00'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (27 项):**

核心功能围绕 6 个领域：
1. **录音管理** (FR1-FR6): AI 引导式录音、离线保存、自动同步
2. **故事画廊** (FR7-FR10): 列表、回放、删除、主题选择
3. **家人收听** (FR11-FR15): 播放、评论、推送通知
4. **认证与权限** (FR16-FR19, FR26, FR28, FR30, FR32): 长者隐式认证 + 家人 Email/Password + Magic Link (Post-MVP)
5. **离线与同步** (FR20-FR22): 网络检测、Sound Cue、同步状态
6. **通知管理** (FR23-FR25, FR27): 推送、徽章、主题提交

**Non-Functional Requirements (14 项):**

| 类别 | 关键指标 |
|:-----|:---------|
| 性能 | VAD <200ms, Sound Cue <100ms, 冷启动 <2s, AI 超时 2000ms |
| 无障碍 | WCAG 2.2 AAA (7:1 对比度), 48dp+ 触摸点, 24pt+ 正文 |
| 可靠性 | 100% 离线录音成功率, 零数据丢失, MD5 校验 |
| 隐私 | Zero Retention, 24h 物理删除, AES-256 本地加密 |

### Scale & Complexity

| 指标 | 评估 |
|:-----|:-----|
| 技术类型 | 📱 移动应用 (React Native/Expo) |
| 复杂度级别 | ⚠️ **中等** |
| 主要技术领域 | 全栈 (移动端 + 语音 AI + 云端同步) |
| 估计架构组件数 | ~8-10 个 |

**复杂度驱动因素:**
- 🔴 离线优先 + 实时 AI: 双轨架构 (Local Loop / Cloud Loop)
- 🟡 老年语音识别: Deepgram 对 ≤120 wpm 语音需验证
- 🟡 3 层系统集成: Client → LiveKit SFU → Voice Agent (Python)
- 🟢 双轨认证: 长者隐式认证 + 家人 Email/Password (Magic Link Post-MVP)

### Technical Constraints & Dependencies

### Technical Constraints & Dependencies

**From Proposal Table 3.3 (Updated Jan 2026):**
- **Transport**: LiveKit (WebRTC) + Python Agents
- **STT/TTS**: Deepgram Nova-3 (Superior to Nova-2)
- **AI Logic**: Gemini 3.0 Flash (Multimodal Native)
- **VAD**: Silero VAD (Elderly Profile: 3-5s pause)
- **Framework**: React Native 0.81 (Expo SDK 54)
- **UI Rendering**: `@shopify/react-native-skia` (WaveformVisualizer; Phase 2) + Reanimated fallback
- **Database**:
    - `expo-sqlite` + `drizzle-orm` (Business Data)
    - `react-native-mmkv` (Settings/State)
- **Backend**: Supabase (Auth, Storage, Realtime)
- **DevOps**: EAS Build + Maestro E2E

**SDK 54 Compatibility Notes (Implementation Guidance):**
- Use `npx expo install` for Expo packages; rerun after SDK upgrades to realign versions.
- Keep `expo-sqlite` on stable (current `16.0.10`) unless Expo docs require `@next`.
- Add `react-native-url-polyfill/auto` only if URL/crypto globals are missing at runtime.
- Configure React Query `onlineManager` via `@react-native-community/netinfo` or `expo-network`.
- Drizzle Live Queries require `openDatabaseSync(..., { enableChangeListener: true })`.
- `@siteed/expo-audio-studio` requires `expo prebuild`/dev build; managed-only flows are not supported.
- LiveKit RN on Expo requires dev builds + `@livekit/react-native-expo-plugin`; pin versions and verify release notes before upgrades.

### Cross-Cutting Concerns Identified

1. **Graceful Degradation**: Network as State + Sync Queue (PowerSync rejected)
2. **無障碍设计**: WCAG 2.2 AAA + Voice First
3. **数据一致性**: Local-First Write + Background Sync
4. **隐私合规**: Zero PII Logging + Physical File Deletion

---

## Architectural Enhancements (Elicitation-Derived)

*以下增强项经过与 Proposal 对比验证，仅保留一致或补充性建议。*

### P0 - Must Have (MVP)

| 增强项 | 对应 Proposal | 实现说明 |
|:-------|:--------------|:---------|
| **Stream-to-Disk** | NFR5 Zero Data Loss | WAV chunk 中间存储 + Opus mux，防断电丢失 |
| **Rate Limiting** | 双轨认证安全加固 | 设备码绑定 5次/10分钟，Supabase Edge Function |
| **Soft Delete** | Universal Undo 后端实现 | 所有删除为逻辑删除，30天保留期 |
| **Session-Scope WebRTC** | ≤2000ms 延迟目标 | 采访开始时连接，结束立即断开 |

### P1 - Should Have (MVP or Fast-Follow)

| 增强项 | 对应 Proposal | 实现说明 |
|:-------|:--------------|:---------|
| **文件头自修复** | 补充 | 启动时检测并修复损坏录音 |
| **分片上传** | 补充 (长录音场景) | >15分钟录音分块上传 |
| **可观测性** | 补充 | 同步事件日志 + 错误监控 |

### Architecture Pillars (五大支柱)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TimeLog Architecture Pillars                  │
└─────────────────────────────────────────────────────────────────┘
                              │
    ┌────────────┬────────────┼────────────┬────────────┐
    │            │            │            │            │
┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐   ┌───▼───┐
│离线优先│   │零数据丢失│   │优雅降级 │   │隐私至上 │   │极简交互│
└───────┘   └───────┘   └───────┘   └───────┘   └───────┘
    │            │            │            │            │
 SQLite     Stream-to    Sound Cue   Zero-Ret   One-Tap
 Drizzle    Disk+Soft    Fallback    Rate-Lim   Big Button
            Delete
```

---

## Starter Template Evaluation

### Primary Technology Domain

**Mobile Application** (React Native + Expo) based on Proposal Table 3.3

### Starter Options Considered

| 选项 | 描述 | 匹配度 |
|:-----|:-----|:-------|
| `expo-local-first-template` | Expo 54 + Drizzle + SQLite + Zustand | ⭐⭐⭐⭐⭐ |
| `create-expo-app --template default` | 官方默认模板 | ⭐⭐⭐ |
| `NativeLaunch` | 付费模板，功能过多 | ⭐⭐⭐ |

### Selected Starter: `expo-local-first-template`

**Rationale for Selection:**
- ✅ Expo SDK 54 + React Native 0.81 (与 Proposal 一致)
- ✅ expo-sqlite + Drizzle ORM 预配置 (Proposal Table 3.3)
- ✅ Expo Router 文件路由 (Proposal 架构)
- ✅ Local-First 架构正是 TimeLog 核心理念
- ✅ NativeWind v4 (与 UX Spec 对齐)
- ✅ Zustand 状态管理 (ADR-004)

**Initialization Command:**

```bash
# Clone starter template
npx degit expo-starter/expo-local-first-template TimeLog

# Install dependencies
cd TimeLog && npm install

# Add Proposal-required packages
npm install @supabase/supabase-js
npm install @livekit/react-native @livekit/react-native-webrtc
npm install @siteed/expo-audio-studio
```

### Architectural Decisions Provided by Starter

| 决策点 | Starter 预设 | 版本 |
|:-------|:-------------|:-----|
| Language | TypeScript strict | 5.x |
| Routing | Expo Router | v4 |
| Database | expo-sqlite + Drizzle | Latest |
| Styling | NativeWind (TailwindCSS) | v4 |
| State Management | Zustand | 5.x |
| Build System | EAS Build | Latest |
| CI/CD | GitHub Actions | Preconfigured |

### Manual Additions Required (From Proposal)

| 包 | Proposal 依据 | 用途 |
|:---|:--------------|:-----|
| `@supabase/supabase-js` | Table 3.3: Supabase | Auth, Storage, Realtime |
| `@livekit/react-native` | Table 3.3: LiveKit | 语音 AI 通道 |
| `@siteed/expo-audio-studio` | Section 3.4 | 录音 + VAD |
| `@shopify/react-native-skia` | UX Spec (Phase 2) | 波形可视化 |

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (已确定):**
- Database: expo-sqlite + Drizzle ORM (Proposal Table 3.3)
- Authentication: Supabase Auth (双轨认证)
- Transport: LiveKit WebRTC
- STT/TTS: Deepgram Nova-3
- LLM: Gemini 3.0 Flash

**Important Decisions (本步骤确定):**
5 项待定决策已通过讨论确定

### Data Architecture

**Migration Strategy**: Drizzle Migration Files
- Command: `drizzle-kit generate`
- Rationale: 符合 NFR5 零数据丢失，提供版本控制和回滚能力
- Drizzle Config: `driver: 'expo'` in `drizzle.config.ts`
- Bundling: `babel-plugin-inline-import` for `.sql` + `metro.config.js` adds `.sql` to resolver
- Execution: App 启动时执行 `useMigrations` hook

### Security

**Token Storage**: expo-secure-store
- Platform: iOS Keychain / Android Keystore
- Encryption: OS 级加密 (符合 AES-256 要求)
- Use Case: 存储 Supabase Auth Token
- Access Pattern: 低频读取，安全优先

### Monitoring & Observability

**Error Tracking**: Sentry
- Plan: Free tier (5K events/月)
- Features: Stack traces, Session Replay, Mobile Vitals
- Integration: @sentry/react-native (Source maps 自动上传)

**Usage Analytics**: Expo Insights
- Focus: OTA 更新采用率
- Integration: expo-insights library

### API Standards

**Error Handling**: HTTP Standard + Custom Body

```json
{
  "error": {
    "code": "AUTH_DEVICE_CODE_EXPIRED",
    "message": "哎呀，设备码过期了，请重新获取一个",
    "httpStatus": 401
  }
}
```

- HTTP 状态码: 标准 4xx/5xx
- Code: TimeLog 专属错误码
- Message: Humble Persona 用户友好消息

### Audio Architecture

**Recording Format**: WAV chunks (Stream-to-Disk)
- Purpose: 断电保护，确保零数据丢失
- Chunk Size: 5 秒

**Storage Format**: Opus 32-48kbps
- Purpose: 节省存储空间 (语音透明级质量)

**Upload Format**: Opus
- Purpose: 节省上传带宽

**Transcode Timing**: 录音结束后立即本地转码
- UI State: Shimmer "正在保存..."
- Rationale: 避免后台转码失败风险


## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 areas where AI agents could make different choices: Naming, Structure, Format, Communication, Process.

### Naming Patterns

**Database Naming Conventions (SQLite/Supabase):**
- **Tables:** `snake_case`, plural. Example: `users`, `audio_recordings`.
- **Columns:** `snake_case`. Example: `created_at`, `is_synced`.
- **Foreign Keys:** `singular_table_id`. Example: `user_id`, `story_id`.
- **Primary Keys:** UUID v7 preferred for offline-safe conflict resolution.
- **Indexes:** `idx_{table}_{column}`. Example: `idx_audio_recordings_created_at`.
- **Mapping:** Use snake_case column names in schema definitions (e.g., `text('created_at')`) to map to camelCase fields; use `.name()` only if supported by the current Drizzle driver/version.

**API Naming Conventions:**
- **REST Endpoints:** kebab-case, plural resources. Example: `/api/v1/audio-recordings`.
- **File Uploads:** `audio-recordings/rec_{uuid_v7}.wav` (Use UUID v7 with meaningful prefix `rec_` or `story_`).
- **Route Parameters:** `:paramName` (Expo Router uses `[paramName]`). Example: `[id].tsx`.
- **Query Parameters:** `camelCase`. Example: `?limit=10&cursor=abc`.
- **Headers:** `Pascal-Kebab-Case`. Example: `X-Client-Version`.

**Code Naming Conventions (TypeScript):**
- **Components:** `PascalCase`. Example: `RecordingButton`.
- **Files:** `kebab-case` for utilities/configs (`date-utils.ts`), `PascalCase` for Components (`RecordingButton.tsx`).
- **Functions/Variables:** `camelCase`. Example: `startRecording`, `isOnline`.
- **Constants:** `UPPER_SNAKE_CASE`. Example: `MAX_RECORDING_DURATION`.
- **Interfaces/Types:** `PascalCase`, optionally prefixed with `I` or `T` (preferred: no prefix). Example: `AudioRecording`.

### Structure Patterns

**Project Organization (Feature-First with Shared Core):**
- **Features:** `src/features/{featureName}/` containing components, hooks, utils specific to feature.
- **Shared:** `src/components/ui` (Design System), `src/lib` (3rd party wrappers), `src/utils` (pure functions).
- **Rule of Three:** "Duplication is cheaper than wrong abstraction." Do not extract shared code until it is used in 3 distinct places.

**File Structure Patterns:**
- **Co-location:** Tests next to implementation (`Button.test.tsx` next to `Button.tsx`).
- **Barrel Files:** Avoid index.ts exports unless necessary for public API to prevent circular deps.
- **Assets:** `assets/images`, `assets/fonts`.
- **Migration Files:** Serial migrations only. One pending migration at a time.

### Format Patterns

**API Response Formats (Envelope Pattern):**
- **Success:** 
  ```json
  {
    "data": [...], 
    "meta": { "pagination": { "page": 1, "limit": 10 } }
  }
  ```
- **Error:** 
  ```json
  {
    "error": {
      "code": "AUTH_INVALID_TOKEN",
      "message": "User friendly message",
      "httpStatus": 401
    }
  }
  ```
- **Dates:** ISO 8601 Strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Safety:** Clients MUST check Content-Type. If not JSON, treat as Service Unavailable.

**Data Exchange Formats:**
- **JSON Fields:** `camelCase` for frontend consumption (transform from snake_case DB at data layer if needed, Drizzle often handles this).
- **Booleans:** `true`/`false` (not 0/1).
- **Nulls:** Nullable fields preferred over undefined in JSON.

### Communication Patterns

**Event System Patterns:**
- **Naming:** `ResourceAction` (Past Tense). Example: `RecordingCompleted`, `UploadFailed`.
- **Payload:** `{ entityId, timestamp, metadata }`.

**State Management Patterns (Zustand):**
- **Stores:** Feature-scoped stores (`useAudioStore`, `useAuthStore`).
- **Actions:** `camelCase` verbs. `setRecordingState`, `uploadRecording`.
- **Selectors:** Named specifically. `useAudioStore(s => s.isRecording)`.

### Process Patterns

**Error Handling Patterns:**
- **Global:** `ErrorBoundary` for UI crashes.
- **Async:** `try/catch` in services, return `Result` type or throw typed errors.
- **Network as State:** Network failures are NOT exceptions. They are state transitions.
  - **Abstraction:** MUST use a unified `SyncClient` wrapper (e.g., around fetch/axios) to handle this transparently.
  - `Offline` -> Enqueue action to Sync Queue. Promise Resolves (Optimistic UI).
  - `Online` -> Drain Sync Queue.
- **User Feedback:** Toast/Snackbar for transient errors, Full screen for blocking errors.

**Loading State Patterns:**
- **Naming:** `isLoading`, `isSubmitting`.
- **UI:** Skeleton screens for initial load, Spinners for actions.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `snake_case` for ALL database definitions.
- Use `camelCase` for ALL TypeScript variables/functions.
- Co-locate tests with components.
- Use the defined Error Response format.

**Pattern Enforcement:**
- CI checks via ESLint (naming conventions).
- PR Review by "Architect" agent.
## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
5 areas where AI agents could make different choices: Naming, Structure, Format, Communication, Process.

### Naming Patterns

**Database Naming Conventions (SQLite/Supabase):**
- **Tables:** `snake_case`, plural. Example: `users`, `audio_recordings`.
- **Columns:** `snake_case`. Example: `created_at`, `is_synced`.
- **Foreign Keys:** `singular_table_id`. Example: `user_id`, `story_id`.
- **Primary Keys:** UUID v7 preferred for offline-safe conflict resolution.
- **Indexes:** `idx_{table}_{column}`. Example: `idx_audio_recordings_created_at`.
- **Mapping:** Use snake_case column names in schema definitions (e.g., `text('created_at')`) to map to camelCase fields; use `.name()` only if supported by the current Drizzle driver/version.

**API Naming Conventions:**
- **REST Endpoints:** kebab-case, plural resources. Example: `/api/v1/audio-recordings`.
- **File Uploads:** `audio-recordings/rec_{uuid_v7}.wav` (Use UUID v7 with meaningful prefix `rec_` or `story_`).
- **Route Parameters:** `:paramName` (Expo Router uses `[paramName]`). Example: `[id].tsx`.
- **Query Parameters:** `camelCase`. Example: `?limit=10&cursor=abc`.
- **Headers:** `Pascal-Kebab-Case`. Example: `X-Client-Version`.

**Code Naming Conventions (TypeScript):**
- **Components:** `PascalCase`. Example: `RecordingButton`.
- **Files:** `kebab-case` for utilities/configs (`date-utils.ts`), `PascalCase` for Components (`RecordingButton.tsx`).
- **Functions/Variables:** `camelCase`. Example: `startRecording`, `isOnline`.
- **Constants:** `UPPER_SNAKE_CASE`. Example: `MAX_RECORDING_DURATION`.
- **Interfaces/Types:** `PascalCase`, optionally prefixed with `I` or `T` (preferred: no prefix). Example: `AudioRecording`.

### Structure Patterns

**Project Organization (Feature-First with Shared Core):**
- **Features:** `src/features/{featureName}/` containing components, hooks, utils specific to feature.
- **Shared:** `src/components/ui` (Design System), `src/lib` (3rd party wrappers), `src/utils` (pure functions).
- **Rule of Three:** "Duplication is cheaper than wrong abstraction." Do not extract shared code until it is used in 3 distinct places.

**File Structure Patterns:**
- **Co-location:** Tests next to implementation (`Button.test.tsx` next to `Button.tsx`).
- **Barrel Files:** Avoid index.ts exports unless necessary for public API to prevent circular deps.
- **Assets:** `assets/images`, `assets/fonts`.
- **Migration Files:** Serial migrations only. One pending migration at a time.

### Format Patterns

**API Response Formats (Envelope Pattern):**
- **Success:** 
  ```json
  {
    "data": [...], 
    "meta": { "pagination": { "page": 1, "limit": 10 } }
  }
  ```
- **Error:** 
  ```json
  {
    "error": {
      "code": "AUTH_INVALID_TOKEN",
      "message": "User friendly message",
      "httpStatus": 401
    }
  }
  ```
- **Dates:** ISO 8601 Strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Safety:** Clients MUST check Content-Type. If not JSON, treat as Service Unavailable.

**Data Exchange Formats:**
- **JSON Fields:** `camelCase` for frontend consumption (transform from snake_case DB at data layer if needed, Drizzle often handles this).
- **Booleans:** `true`/`false` (not 0/1).
- **Nulls:** Nullable fields preferred over undefined in JSON.

### Communication Patterns

**Event System Patterns:**
- **Naming:** `ResourceAction` (Past Tense). Example: `RecordingCompleted`, `UploadFailed`.
- **Payload:** `{ entityId, timestamp, metadata }`.

**State Management Patterns (Zustand):**
- **Stores:** Feature-scoped stores (`useAudioStore`, `useAuthStore`).
- **Actions:** `camelCase` verbs. `setRecordingState`, `uploadRecording`.
- **Selectors:** Named specifically. `useAudioStore(s => s.isRecording)`.

### Process Patterns

**Error Handling Patterns:**
- **Global:** `ErrorBoundary` for UI crashes.
- **Async:** `try/catch` in services, return `Result` type or throw typed errors.
- **Network as State:** Network failures are NOT exceptions. They are state transitions.
  - **Abstraction:** MUST use a unified `SyncClient` wrapper (e.g., around fetch/axios) to handle this transparently.
  - `Offline` -> Enqueue action to Sync Queue. Promise Resolves (Optimistic UI).
  - `Online` -> Drain Sync Queue.
- **User Feedback:** Toast/Snackbar for transient errors, Full screen for blocking errors.

**Loading State Patterns:**
- **Naming:** `isLoading`, `isSubmitting`.
- **UI:** Skeleton screens for initial load, Spinners for actions.

### Enforcement Guidelines

**All AI Agents MUST:**
- Use `snake_case` for ALL database definitions.
- Use `camelCase` for ALL TypeScript variables/functions.
- Co-locate tests with components.
- Use the defined Error Response format.

**Pattern Enforcement:**
- CI checks via ESLint (naming conventions).
- PR Review by "Architect" agent.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
TimeLog/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint, Type Check, Test
│       └── build-preview.yml      # EAS Build Preview
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   ├── splash.png
│   └── fonts/                     # Custom fonts (Inter/Roboto)
├── app/                           # Expo Router (File-based routing)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # Auth Entry (Elder implicit, Family Email/Password + Magic Link Post-MVP)
│   │   └── verify.tsx             # Code Verification
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx              # Recorder (Home)
│   │   ├── gallery.tsx            # Story Gallery
│   │   └── family.tsx             # Family Listener Activity
│   ├── _layout.tsx                # Root Provider (Auth, Query, Theme)
│   ├── +not-found.tsx
│   └── modal.tsx 
├── src/
│   ├── features/                  # Feature-First Organization
│   │   ├── auth/
│   │       ...
│   │   ├── recorder/
│   │   │   ├── components/        # BigRedButton, AudioVisualizer
│   │   │   ├── hooks/             # useRecorder (Siteed/Expo-Audio)
│   │   │   ├── services/          # vad-service.ts, file-system-service.ts
│   │   │   └── config/            # recorder-sync-config.ts (Retry policy, Priority)
│   │   ├── story-gallery/
│       ...
│   ├── components/
│   │   ├── ui/                    # Shared Design System (NativeWind)
│   │   │   ├── feedback/          # toast.tsx, spinner.tsx
│   │   │   ├── forms/             # button.tsx, input.tsx
│   │   │   ├── layout/            # card.tsx, divider.tsx
│   │   │   └── typography/        # text.tsx
│   │   └── layout/                # ScreenWrapper, SafeAreaView
│   ├── db/
│       ...
│   ├── lib/                       # Core Infrastructure Wrappers
│   │   ├── supabase.ts            # Supabase Client Singleton
│   │   ├── livekit.ts             # LiveKit Room Manager
│   │   ├── sync-engine/           # [Refactored] Network-as-State Engine
│   │   │   ├── queue.ts           # Offline Queue Logic
│   │   │   └── transport.ts       # Network Execution
│   │   └── logger.ts              # Sentry Wrapper
│   ├── types/                     # [NEW] Shared Domain Models (Prevent Circular Deps)
│   │   ├── entities.ts            # User, Recording, Story
│   │   └── api.ts                 # Shared API Interfaces
│   └── utils/
├── tests/
│   ├── integration/               # Flow Tests (Recorder -> DB -> Sync)
│   ├── e2e/                       # Maestro Flows
│   └── mocks/                     # Network/Audio Mocks
│   # Note: Unit tests are co-located with components (Button.test.tsx)├── drizzle/                       # Drizzle Kit Config & Output
├── app.json                       # Expo Config
├── babel.config.js
├── drizzle.config.ts              # Drizzle Kit Configuration
├── metro.config.js                # Metro Bundler Config (SQL support)
├── package.json
├── tailwind.config.js             # NativeWind Configuration
└── tsconfig.json
```

### Architectural Boundaries

**API Boundaries:**
- **External:** All external calls (Supabase, LiveKit, Deepgram) MUST go through `src/lib/*` wrappers. Direct fetch in components is FORBIDDEN.
- **Sync Boundary:** `src/lib/sync-engine` handles mechanism (Queue/Transport). Feature `config/` defines policy (What/When).
- **Dependency Rule:** `src/lib` CANNOT import from `src/features`. Use `src/types` for shared definitions.
- **Database:** `src/db/client.ts` is the single source of truth for SQLite access.

**Component Boundaries:**
- **Smart vs Dumb:** `src/features/**/components` are Smart (connected to stores/hooks). `src/components/ui` are Dumb (pure props).
- **Navigation:** `app/` files only handle routing params and layout. Logic MUST be delegated to `src/features`.

**Data Boundaries:**
- **Local First:** Writes always go to SQLite first (via Drizzle).
- **Replication:** `SyncService` (background) listens to SQLite changes or SyncQueue to push to Supabase.
- **Audio Files:** Stored in `FileSystem.documentDirectory/recordings/`. Metadata in SQLite.

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

*   **Recorder Epic** (FR1-6)
    *   UI: `src/features/recorder/components`
    *   Logic: `src/features/recorder/hooks/useRecorder.ts`
    *   Storage: `src/features/recorder/services/file-system-service.ts`
    *   Route: `app/(tabs)/index.tsx`

*   **Auth Epic** (FR16-19)
    *   UI: `src/features/auth/components`
    *   Service: `src/features/auth/services/auth-service.ts`
    *   Route: `app/(auth)/*`

*   **Offline Capability** (NFR6)
    *   Core: `src/lib/sync-client.ts`
    *   Queue: SQLite table `sync_queue` (in `schema.ts`)

### Integration Points

**Internal Communication:**
- **Global State:** Zustand Stores in `src/features/*/stores` (e.g., `useRecorderStore`).
- **Events:** `DeviceEventEmitter` for low-level audio events (VAD triggers) to UI.

**External Integrations:**
- **Supabase:** Auth & Data Sync (via `lib/supabase.ts`).
- **LiveKit:** Real-time Transport (via `lib/livekit.ts`).
- **Sentry:** Error boundary integration (via `lib/logger.ts`).

### Development Workflow Integration

- **Development:** `npx expo start --dev-client` (Native code required).
- **Database:** `npx drizzle-kit push` (Prototyping) or `generate` (Migration).
- **Build:** `eas build --profile development` (Internal Testing).

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- **Technology:** The combination of **Expo (UI)**, **SQLite (Local DB)**, and **Supabase (Cloud Sync)** is a battle-tested "Local-First" stack.
- **Audio Pipeline:** **LiveKit (Transport)** + **Deepgram (STT)** + **Stream-to-Disk (Storage)** provides a robust, latency-sensitive audio pipeline without conflict.
- **Compatibility:** All selected libraries (NativeWind v4, Drizzle, Zustand) are compatible with Expo SDK 54 and React Native 0.81 (New Architecture enabled).

**Pattern Consistency:**
- **Sync Pattern:** The **"Network as a State"** pattern is perfectly supported by the **Sync Engine** structure decisions.
- **Naming:** `snake_case` (DB) vs `camelCase` (JS) conflict is resolved via **Drizzle Mapping** and **Shared Types**.
- **Boundaries:** The **Service Layer Mandate** reinforces the architectural boundary between UI and External IO.

**Structure Alignment:**
- The **Feature-First** structure aligns with the **Domain-Driven Design**.
- The `src/lib/sync-engine` directory provides a physical home for the critical **Offline Queue** pattern.
- `src/types` explicitly solves circular dependency risks AND **Vendor Lock-in** (by shielding Supabase types).

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**
- **Recorder Epic:** Covered by `src/features/recorder`. **Critical**: Must implement "Elderly VAD Profile" (3-5s silence tolerance) to prevent interruption.
- **Story Gallery:** Covered by `src/features/story-gallery` and `Drizzle Live Query`.
- **Family Listener:** Covered by `src/features/family-listener` and `Supabase Realtime`.
- **Auth:** Covered by `src/features/auth` and `Supabase Auth` (Elder implicit session + Family Email/Password + Magic Link Post-MVP).

**Non-Functional Requirements Coverage:**
- **Zero Data Loss:** Architecturally guaranteed by **Stream-to-Disk** (saving chunks before upload) and **Sync Queue** (retry mechanism).
- **Offline First:** Fully supported by **SQLite** primary storage and **Optimistic UI**.
- **Performance:** **NativeWind** (Zero-runtime styling) and **FlashList** (implied for Gallery) ensure 60fps.
- **Privacy:** **Local First** and **UUID v7** support privacy. **Log Scrubbing** (Sentry `beforeSend`) is required to prevent transcript leaks.

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical technology choices (DB, Auth, Audio) are finalized.
- Version constraints (Expo 54, RN 0.81) are specified.

**Structure Completeness:**
- Full directory tree is defined down to the file level for key components.
- `src/types` and `src/services` boundaries are strictly enforced.

**Pattern Completeness:**
- Coding standards (Naming, Error Handling) are explicit.
- Testing strategy (Co-location vs Integration) is clear.

### Gap Analysis Results

**Critical Gaps:** None.
**Critical Gaps:** None.
**Important Gaps:**
- **Disk Space Management:** 3-hour WAV recordings (~350MB) pose a risk. Implementation MUST include **Pre-check** (<500MB warn) and **Auto-Save on Low Disk**. (Rolling Transcode deferred to Post-MVP).
- **VAD Sensitivity Tuning:** Default VAD is too aggressive. Runtime tuning via **Dev Menu** is essential to find the "Elderly Profile" sweet spot.
 
**Nice-to-Have Gaps:**
- **Migration Rollback Plan:** Mobile apps typically use forward-only migrations. Rollback scripts are low priority.
- **Theming System:** Extensions to NativeWind theme for "Elderly High Contrast" mode.

### Architecture Readiness Assessment

**Overall Status:** **READY FOR IMPLEMENTATION**

**Confidence Level:** **High**
The architecture has withstood "Red Team" attacks and "Party Mode" scrutiny. The structure is practically synonymous with the requirements.

**Key Strengths:**
1.  **Resilience:** The Sync Engine + Stream-to-Disk combo makes data loss nearly impossible.
2.  **Clarity:** "Screaming Architecture" (Feature-First) makes the codebase self-documenting.
3.  **Testability:** Service Layer isolation allows for easy mocking of the complex Cloud/AI dependencies.

