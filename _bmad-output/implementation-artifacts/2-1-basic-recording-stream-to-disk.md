# Story 2.1: 基础录音与权限管理 (Stream-to-Disk)

Status: review

## Story

As a Senior User,  
I want to grant microphone permissions once and start recording immediately,  
So that I can capture my voice without technical friction.

## Acceptance Criteria

1. **Given** 我首次进入录音界面并点击「录音」  
   **When** 系统请求麦克风权限并检测可用存储  
   **Then** 如果剩余空间 < 500MB，弹出友好提示「请清理空间以继续录音」，录音不会开始。
2. **Given** 空间充足且用户授予权限  
   **When** 录音开始  
   **Then** 音频以流式写入磁盘（WAV 分片，文件命名 `rec_{uuid_v7}.wav`），避免内存溢出。
3. **Given** 录音进行中  
   **When** 检测到 3–5s 静音（Elderly VAD 配置）  
   **Then** 录音保持进行，但不会因短暂停顿被中断（宽容策略生效）。
4. **Given** 录音开始  
   **When** 录音元数据被创建  
   **Then** 本地 SQLite 中写入一条记录（状态 `unsynced`，包含文件路径、开始时间、设备/用户标识）。

## Tasks / Subtasks

- [x] Task 1: 权限与存储预检查（AC: 1,2）
  - [x] 1.1: 使用 `expo-av` 申请麦克风权限（仅第一次提示），封装在服务层。
  - [x] 1.2: 在开始录音前调用 `FileSystem.getFreeDiskStorageAsync()`，<500MB 则阻断并提示。

- [x] Task 2: 录音流式写盘（AC: 2）
  - [x] 2.1: 接入 `@siteed/expo-audio-stream` 实现 WAV 写盘（文件命名 `rec_{uuid_v7}.wav`，存储路径 `FileSystem.documentDirectory/recordings/`）。
  - [x] 2.2: 抽象录音控制器（start/stop/pause/resume）供 UI 调用，返回文件路径与元数据。

- [x] Task 3: Elderly VAD 配置（AC: 3）
  - [x] 3.1: 配置 Silero VAD（或库内置 VAD）为 3–5s 静音容忍度，避免过度剪切。  
  - [x] 3.2: 在录音过程中确保静音不自动停止录音，仅用于后续分段/提示。

- [x] Task 4: 本地元数据写入（AC: 4）
  - [x] 4.1: 扩展 Drizzle schema：`audio_recordings`（id uuid_v7 PK, file_path, duration_ms, size_bytes, started_at, ended_at, is_synced, checksum_md5, topic_id?, user_id?, device_id?）。
  - [x] 4.2: 录音开始时插入一条 `unsynced` 记录（最小字段：id、file_path、started_at、is_synced=false）。

- [x] Task 5: UI 钩子与错误处理（AC: 1,2,3）
  - [x] 5.1: 在录音界面实现「录音」按钮调用 start，失败时显示人性化错误（空间不足/权限拒绝）。
  - [x] 5.2: 录音状态可视指示（占位：文本/小动画），后续 Story 2.2 用 Skia 波形替换。

## Dev Notes

- 录音与 IO 必须放在 `src/features/recorder/services/`；UI 不直接触碰 FileSystem/stream。
- 路径：`FileSystem.documentDirectory/recordings/rec_{uuid_v7}.wav`；创建目录并校验存在。
- 同步策略：该 Story 仅负责本地写入与元数据；上传/校验在 Story 2.5/2.6。
- 校验：记录文件大小与 MD5（可延后到同步时）；保留 chunk 写入以支持断点续传。
- 错误提示使用温和文案，避免技术词汇；遵守「不丢数据」与「不打断老人讲话」原则。

## File Structure Requirements

- `src/features/recorder/services/recorderService.ts`（新）
- `src/features/recorder/services/vadConfig.ts`（或内联配置）
- `src/db/schema/audioRecordings.ts`（新）并在 `src/db/schema/index.ts` 导出
- `app/(tabs)/index.tsx` 或专用录音屏新增调用入口（可先占位）

## Testing Requirements

- 手动：首次打开录音界面 → 请求权限 → 磁盘检查 → 录音写入文件 → DB 有记录。
- 手动：模拟 <500MB（可临时调高阈值验证） → 应提示并阻断。
- 手动：短暂停顿（<5s）不会停止录音。

## References

- `_bmad-output/planning-artifacts/epics.md#Story 2.1`
- `project-context.md#Critical Implementation Rules`
- `project-context.md#Audio & Hardware Safeguards`

## Dev Agent Record
### Agent Model Used

Codex CLI (GPT-5)

### Debug Log References

- `npm test`
- `npx prettier --write app.json drizzle/meta/_journal.json drizzle/meta/0001_snapshot.json drizzle/migrations.js jest-setup.js jest.config.js src/features/auth/hooks/useDeepLinkHandler.ts src/features/auth/services/authService.test.ts src/features/recorder/services/recorderService.test.ts src/features/recorder/services/recorderService.ts src/lib/supabase.test.ts src/lib/sync-engine/queue.ts src/lib/sync-engine/transport.ts test-utils/css-interop-mock.js`
- `npm run lint`

### Completion Notes List

- Added metering-based silence tracking that triggers after the elderly VAD window without stopping the recording.
- Wired silence tracking into the recorder service to keep recordings active while enabling future segmentation hints.
- Added unit coverage for sustained-silence notification and confirmed recording is not auto-stopped.
- Wired the recorder screen to show a gentle silence notice while recording.
- Formatted 14 files to satisfy Prettier check; lint now passes.

### File List

- app.json
- jest-setup.js
- jest.config.js
- app/(tabs)/index.tsx
- drizzle/meta/_journal.json
- drizzle/meta/0001_snapshot.json
- drizzle/migrations.js
- src/features/auth/hooks/useDeepLinkHandler.ts
- src/features/auth/services/authService.test.ts
- src/features/recorder/services/recorderService.test.ts
- src/features/recorder/services/recorderService.ts
- src/features/recorder/services/vadConfig.ts
- src/lib/supabase.test.ts
- src/lib/sync-engine/queue.ts
- src/lib/sync-engine/transport.ts
- test-utils/css-interop-mock.js

### Change Log

- 2026-01-13: Added silence tracking that preserves recording continuity and tests for the elderly VAD tolerance window.
- 2026-01-13: Added a UI silence hint on the recorder screen using the onSilence callback.
- 2026-01-13: Formatted files to satisfy Prettier linting checks.
