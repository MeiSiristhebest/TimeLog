---
stepsCompleted: [1, 2]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
---

# TimeLog - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for TimeLog, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Senior user can start voice recording
FR2: Senior user can receive AI-guided prompts/questions
FR3: Senior user can pause and resume recording
FR4: Senior user can end recording and save
FR5: System saves recording locally in offline mode
FR6: System automatically syncs recording when network is available
FR7: Senior user can view list of recorded stories
FR8: Senior user can playback their stories
FR9: Senior user can delete stories
FR10: Senior user can choose recording topics from a library
FR11: Family user can view parent's story list
FR12: Family user can play story recordings
FR13: Family user can comment on stories
FR14: Family user receives push notifications for new stories
FR15: Senior user can see family comments
FR16: Senior user can login via implicit device-bound session (no password)
FR17: Family user can login via Email/Password
FR18: System identifies device and keeps login state automatically
FR19: Family user can share account with multiple members
FR20: System detects network state and plays Sound Cue
FR21: System triggers sync queue when in foreground
FR22: System displays sync status (Waiting/Syncing/Completed)
FR23: System sends new story notifications to family
FR24: System sends comment notifications to senior
FR25: User sees unread message badges in App
FR26: Family user can generate recovery code for senior (device loss)
FR27: Family user can submit new questions to topic library
FR28: Family user can use Magic Link as Post-MVP login fallback
FR29: User can disable cloud AI features and cloud sharing without affecting local recording
FR30: Family sharing/binding requires explicit senior opt-in and can be revoked
FR31: System records provider + retention configuration as audit metadata (no PII)
FR32: Senior user can configure trusted-contact recovery as a fallback

### NonFunctional Requirements

NFR1 (VAD Latency): Local VAD <200ms silence detection
NFR2 (Sound Cue): Playback latency <100ms
NFR3 (Startup): Cold start to Ready <2s
NFR4 (AI Timeout): Cloud AI timeout 2000ms
NFR5 (Zero Data Loss): No audio loss on crash/power failure
NFR6 (Offline Trigger): Switch to offline mode after 3 failures or <2s
NFR7 (Sync Integrity): MD5 Checksum verification
NFR8 (Text Size): Body >24pt (WCAG Resize Text)
NFR9 (Touch Target): Core buttons >=48x48dp (WCAG AA)
NFR10 (Contrast): Core Text WCAG AAA (7:1)
NFR11 (Accessible Auth): No cognitive tests for login
NFR12 (Zero Retention): No third-party training data retention
NFR13 (Right to Erasure): Physical deletion within 24h
NFR14 (Local Encryption): SQLite/Storage using AES-256

### Additional Requirements

**Architecture:**
- **Starter Template:** Use `expo-local-first-template` (Expo 54, Drizzle, SQLite, Zustand, NativeWind v4).
- **Data Migration:** Use Drizzle Migration Files strategy (`drizzle-kit generate`).
- **Security:** Token storage in `expo-secure-store` (AES-256).
- **Monitoring:** Integrate Sentry (Error Tracking) and Expo Insights (Analytics).
- **API Standards:** Use HTTP Standard status codes + Custom Body for business errors.
- **Audio Architecture:** Implement Stream-to-Disk (WAV chunks 5s) + Opus for storage/upload.
- **Offline Logic:** Implement Dual Loop (Local/Cloud) logic.

**UX Design:**
- **Design System:** NativeWind-only with a custom component library (Heritage Palette: Terracotta/Cream).
- **Navigation:** Bottom Tab Bar (Home, Gallery, Topics, Settings). No hamburger menus.
- **Interactions:** "Big Red Button" (72dp) for recording. No destructive swipes.
- **Feedback:** Implement visual Heartbeat, Haptic feedback, and Audio Cues (Dong/Beep).
- **Components:** Create `WaveformVisualizer` (Skia), `QuestionCard` (Dialog/Silent modes).
- **Accessibility:** Support Dynamic Type (max 1.5x) and Reduced Motion.

### FR Coverage Map

| FR | Epic | Description |
|:---|:-----|:------------|
| FR1 | Epic 2 | Start voice recording |
| FR2 | Epic 2 | AI-guided prompts |
| FR3 | Epic 2 | Pause/resume recording |
| FR4 | Epic 2 | End and save recording |
| FR5 | Epic 2 | Offline local save |
| FR6 | Epic 2 | Auto-sync on network |
| FR7 | Epic 3 | View story list |
| FR8 | Epic 3 | Playback stories |
| FR9 | Epic 3 | Delete stories |
| FR10 | Epic 3 | Topic library selection |
| FR11 | Epic 4 | Family view story list |
| FR12 | Epic 4 | Family play recordings |
| FR13 | Epic 4 | Family comment |
| FR14 | Epic 5 | New story push notification |
| FR15 | Epic 4 | Senior sees comments |
| FR16 | Epic 1 | Elder implicit login (device-bound session) |
| FR17 | Epic 1 | Family Email/Password login |
| FR18 | Epic 1 | Auto login state |
| FR19 | Epic 1 | Multi-member sharing |
| FR20 | Epic 2 | Network detection + Sound Cue |
| FR21 | Epic 2 | Foreground sync trigger |
| FR22 | Epic 2 | Sync status display |
| FR23 | Epic 5 | New story notifications |
| FR24 | Epic 5 | Comment notifications |
| FR25 | Epic 5 | Unread badges |
| FR26 | Epic 1 | Recovery code generation |
| FR27 | Epic 5 | Topic submission |
| FR28 | Epic 1 | Magic Link login (Post-MVP) |
| FR29 | Epic 2 | Cloud AI/share toggle |
| FR30 | Epic 1 | Explicit sharing opt-in + revoke |
| FR31 | Epic 0 | Retention audit metadata |
| FR32 | Epic 1 | Trusted-contact recovery |

## Epic List

### Epic 0: Foundation (技术基础)
**Goal:** 开发者拥有可工作的 Expo 项目，包含 Local-First 架构基础。
**FRs covered:** (Architecture requirements), FR31
**Implementation Notes:** 使用 `expo-local-first-template` 初始化项目，配置 Drizzle、SQLite、NativeWind。

---

### Epic 1: 认证与设备绑定
**Goal:** 长者用户使用设备绑定的隐式认证；家人用户以 Email/Password 登录。Post-MVP 可提供 Magic Link 辅助登录。两端都能保持登录状态，且共享需显式同意。
**FRs covered:** FR16, FR17, FR18, FR19, FR26, FR28, FR30, FR32
**Implementation Notes:** 实现 Supabase Auth 双轨认证，expo-secure-store 存储 Token，设备码用于绑定而非登录。

---

### Epic 2: 语音录音、本地存储与同步
**Goal:** 长者用户可以录制故事，接收 AI 引导式提问，暂停/恢复录音，并将故事保存到本地——即使离线也不丢失。网络恢复后自动同步。
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR20, FR21, FR22, FR29
**Implementation Notes:** 实现 Stream-to-Disk (WAV 5s chunks)，Sound Cue 离线提示，MD5 校验同步。

---

### Epic 3: 故事画廊与回放
**Goal:** 长者用户可以查看已录制的故事列表，播放故事，删除故事，并从主题库选择录音话题。
**FRs covered:** FR7, FR8, FR9, FR10
**Implementation Notes:** Card-based 列表，Absolute Date 显示，Soft Delete + 30 天 Bin。

---

### Epic 4: 家人收听与互动
**Goal:** 家人用户可以查看、播放父母的故事，发表评论。长者用户可以看到家人的评论。
**FRs covered:** FR11, FR12, FR13, FR15
**Implementation Notes:** Supabase Realtime 评论同步；通知事件由 Epic 5 处理。 

---

### Epic 5: 通知与参与度
**Goal:** 系统发送评论通知给长者与新故事通知给家人，App 内显示未读徽章。家人用户可以向主题库提交新问题。
**FRs covered:** FR14, FR23, FR24, FR25, FR27
**Implementation Notes:** Edge Function 触发推送，Supabase RLS 控制可见性。

---

## Epic 0: Foundation (技术基础)

开发者拥有可工作的 Expo 项目，包含 Local-First 架构、Design System 基础、和 CI/CD 配置。
**备注：** Foundation epic 为启用型例外（已明确批准），范围需尽量小以快速释放用户价值，并要求 Timebox 在早期完成。       

### Story 0.1: 初始化 Expo 项目与 Local-First 架构
As a Developer,
I want to initialize the project with the specific `expo-local-first-template` and core dependencies,
So that I have a solid, architecture-aligned foundation for feature development.

**Acceptance Criteria:**
**Given** the development environment is set up
**When** I run the initialization commands using `expo-local-first-template`
**Then** a new Expo project is created with Drizzle, SQLite, and TypeScript configured
**And** the project runs successfully on both iOS Simulator and Android Emulator
**And** the folder structure matches the Feature-First architecture defined in architecture.md

### Story 0.2: 配置 NativeWind 设计系统
As a Developer,
I want to configure NativeWind v4 and implement the "Heritage" color palette,
So that I can build UI components that match the UX specification's warm aesthetic.

**Acceptance Criteria:**
**Given** the project is initialized
**When** I configure `tailwind.config.js` with the specific Heritage palette (Primary: #C26B4A, Surface: #FFFAF5)
**Then** I can use custom class names like `bg-primary` and `text-surface`
**And** the app uses the system default font stack as defined in UX
**And** base body text tokens are set to 24pt or above per accessibility rules
**And** a "Hello World" screen verifies the custom colors render correctly

### Story 0.3: 搭建底部导航栏骨架
As a Developer,
I want to implement the Bottom Tab navigation structure,
So that I have the shell for the application's main views.

**Acceptance Criteria:**
**Given** `expo-router` is installed
**When** I create the root layout with a Bottom Tab Bar
**Then** I see placeholders for Home (Recording), Gallery, Topics, and Settings tabs
**And** the Tab Bar uses the Heritage design system styles (no system blue)
**And** navigation between tabs works smoothly

### Story 0.4: 集成可观测性工具 (Sentry)
As a Developer,
I want to integrate Sentry and Expo Insights,
So that I can track crashes and stability issues from day one.

**Acceptance Criteria:**
**Given** I have Sentry project DSNs
**When** I install `@sentry/react-native` and configure the initialization code
**Then** a test error triggered in the App appears in the Sentry dashboard
**And** source maps are uploaded correctly during the build process

### Story 0.5: 审计元数据记录 (保留期配置)
As a Developer,
I want to store provider and retention configuration as audit metadata,
So that we can demonstrate compliance without storing PII.

**Priority:** MVP

**Acceptance Criteria:**
**Given** the app loads configuration at startup
**When** the retention settings are resolved
**Then** provider, plan, and retention mode are persisted in a local audit record
**And** no user identifiers or transcripts are stored in this audit record

---

## Epic 1: 认证与设备绑定

长者用户使用设备绑定的隐式认证；家人用户以 Email/Password 登录。Post-MVP 可提供 Magic Link 辅助。共享需显式同意并可撤回。

### Story 1.1: 配置 Supabase Auth 与基础 RLS
As a Developer,
I want to initialize the Supabase client and configure basic Row Level Security (RLS) policies,
So that user data is secure by default and accessible only to authorized users.

**Acceptance Criteria:**
**Given** a Supabase project is created
**When** I configure the Auth providers (Email/Password + Magic Link Post-MVP)
**Then** I can successfully initialize the Supabase client in the App
**And** a "deny all" RLS policy is applied to all tables by default
**And** specific "select" policies allow authenticated users to read their own profile

### Story 1.2: 家人用户 Email/Password 登录
As a Family User,
I want to log in using Email/Password,
So that I can reliably access the family dashboard.

**Acceptance Criteria:**
**Given** I am on the Welcome screen
**When** I enter a valid email and password and submit
**Then** I am authenticated and redirected to the Home screen
**And** invalid credentials show a friendly error with retry guidance
**And** I can access a "Forgot Password" link to request a reset email

### Story 1.3: 管理长者设备码 (生成/恢复/吊销)
As a Family User,
I want to generate a 6-digit code for my parent's device and manage existing codes,
So that I can link their device and set up a replacement device if one is lost (Recovery).

**Acceptance Criteria:**
**Given** I am logged in as a Family User
**When** I navigate to "Add Senior Device"
**Then** I can generate a temporary 6-digit code (valid for 15 mins)
**And** I can see a list of active devices linked to the account
**And** I can revoke a specific device's access (e.g., lost device), forcing it to log out
**And** generation is rate-limited (max 5 codes/hour per account) to prevent abuse

### Story 1.4: 长者用户隐式登录与设备绑定
As a Senior User,
I want the app to sign me in automatically on first launch,
So that I don't need to deal with emails or complex passwords.

**Acceptance Criteria:**
**Given** I select "Storyteller" on first launch
**When** the app initializes
**Then** a device-bound session is created and stored securely
**And** a shareable 6-digit Device Code is generated for family linking
**And** no login form is shown to the senior user

### Story 1.5: 自动登录与启动页 (Splash Screen)
As a User,
I want the app to remember me and load quickly,
So that I can start using it immediately without logging in every time.

**Acceptance Criteria:**
**Given** I have previously logged in
**When** I relaunch the App
**Then** I see a branded Splash Screen while the session restores
**And** I am automatically taken to the Home screen
**And** the token is securely retrieved from `expo-secure-store`
**And** if the session is invalid/expired, I am routed to the login screen with a friendly prompt

### Story 1.6: 邀请家庭成员 (多账号共享)
As a Family User (Admin),
I want to invite other family members via email to manage the same senior account,
So that my siblings can also listen to stories and interact.

**Acceptance Criteria:**
**Given** I am an admin of the family account
**When** I enter a sibling's email address
**Then** they receive an invitation link via email
**And** upon accepting, they are added to the `family_members` table
**And** they gain access to view and comment on the senior's stories

### Story 1.7: 家人用户 Magic Link 辅助登录
As a Family User,
I want to request a magic link as a fallback login method,
So that I can access the app even if I forget my password.

**Priority:** Post-MVP

**Acceptance Criteria:**
**Given** I am on the login screen
**When** I request a magic link for my email
**Then** I receive an email with a secure login link
**And** tapping the link deep-links into the App and authenticates me
**And** I am redirected to the Home screen
**And** expired/invalid links show a friendly error and return me to login

### Story 1.8: 家人共享显式同意与撤回
As a Senior User,
I want to explicitly approve family sharing and revoke it later,
So that I remain in control of who can access my stories.

**Priority:** MVP

**Acceptance Criteria:**
**Given** a family member enters my Device Code
**When** a sharing request is generated
**Then** I see a clear consent prompt with Approve/Decline
**And** approving links the account; declining keeps access denied
**And** I can revoke sharing at any time from Settings

### Story 1.9: 可信联系人恢复
As a Senior User,
I want to set a trusted contact recovery method,
So that I can restore access if no family member is available.

**Priority:** Post-MVP

**Acceptance Criteria:**
**Given** I am in Settings > Recovery
**When** I add a trusted contact and verify it
**Then** the contact is saved as a recovery option
**And** recovery requests require contact confirmation before re-linking a device

---

## Epic 2: 语音录音、本地存储与同步

长者用户可以录制故事，接收 AI 引导式提问，暂停/恢复录音，并将故事保存到本地——即使离线也不丢失。网络恢复后自动同步。

### Story 2.1: 基础录音与权限管理 (Stream-to-Disk)
As a Senior User,
I want to grant microphone permissions once and start recording immediately,
So that I can capture my voice without technical friction.

**Acceptance Criteria:**
**Given** I am on the Recording screen for the first time
**When** I tap the Record button
**Then** the system requests Microphone permissions (and checks for >500MB free disk space)
**And** if space is low, a friendly alert "Please clear some space for new stories" is shown
**And** upon granting, the recording starts immediately leveraging `expo-audio-studio`
**And** audio data is written directly to disk (WAV chunks) to prevent memory issues

### Story 2.2: 录音交互与波形可视化
As a Senior User,
I want to see a visual indication that the app is listening,
So that I know my voice is actually being recorded.

**Acceptance Criteria:**
**Given** recording is active
**When** I speak into the device
**Then** I see a real-time waveform visualization (using Skia) responding to my voice volume
**And** I can tap "Pause" to temporarily stop recording
**And** I can tap "Resume" to continue the same session

### Story 2.3: AI 语音引导 (TTS)
As a Senior User,
I want to hear a clear prompt question when I open the recorder,
So that I know what to talk about.

**Acceptance Criteria:**
**Given** I enter the recording screen
**When** the screen loads
**Then** the selected topic question is played aloud (TTS) via the speaker
**And** I can tap a "Replay" button to hear it again
**And** I can tap "New Topic" to cycle to a different random question

### Story 2.4: Local-First 存储与 Sound Cue
As a User,
I want my recording to be saved instantly to the device and confirmed with a sound,
So that I feel confident my story is safe even if the internet is down.

**Acceptance Criteria:**
**Given** I finish a recording
**When** I tap "Stop & Save"
**Then** the record is inserted into the local SQLite DB with status `local`
**And** a distinct "Success Ding" sound plays immediately (regardless of network)
**And** I am returned to the Home screen

### Story 2.5: 健壮同步引擎 (Resumable Upload)
As a System,
I want to upload large audio files reliably in the background,
So that they are safely backed up to the cloud without blocking the user.

**Acceptance Criteria:**
**Given** a new local recording exists and network is available
**When** the Sync Engine processes the queue
**Then** the file is uploaded to Supabase Storage using a resumable/chunked method
**And** if the upload is interrupted, it retries with exponential backoff (2s, 4s, 8s...)
**And** an MD5 checksum is verified upon completion

### Story 2.6: 同步状态指示器
As a Senior User,
I want to know if my stories are backed up,
So that I don't worry about losing them.

**Acceptance Criteria:**
**Given** I am on the Story List
**When** a story is syncing
**Then** I see a "Syncing..." indicator (e.g., spinning icon)
**And** when finished, it changes to "Saved to Cloud"
**And** if offline/failed, I see a "Waiting for Network" status

### Story 2.7: 异常中断处理与后台保活
As a User,
I want the app to handle interruptions gracefully,
So that I don't lose my story if a phone call comes in.

**Acceptance Criteria:**
**Given** I am recording
**When** a phone call comes in or I background the app
**Then** the recording automatically pauses (and saves current state)
**And** the app maintains a background audio session to prevent OS suspension (Requires Expo Development Build)
**And** upon returning, I can resume from where I left off

### Story 2.8: 云端 AI 功能开关
As a Senior User,
I want to disable cloud AI prompts/transcription and cloud sharing when I choose,
So that my local recording continues without uploading data.

**Priority:** MVP

**Acceptance Criteria:**
**Given** I am in Settings > Privacy
**When** I turn off "Cloud AI & Sharing"
**Then** AI prompting and cloud uploads are disabled for new sessions
**And** local recording remains fully functional
**And** the UI shows a "Local Only" status indicator

---

## Epic 3: 故事画廊与回放

长者用户可以查看已录制的故事列表，播放故事，删除故事，并从主题库选择录音话题。

### Story 3.1: 故事列表与时间轴 (Timeline View)
As a Senior User,
I want to browse my recorded stories in a chronological list,
So that I can easily find a specific memory I recorded previously.

**Acceptance Criteria:**
**Given** I am on the Gallery tab
**When** the list loads
**Then** I see stories ordered by date (newest first)
**And** each card shows the Absolute Date (e.g., "2024年1月1日"), Duration, and Title
**And** I can distinguish between locally stored (offline available) and cloud-only stories via an icon

### Story 3.2: 智能混合播放器 (Hybrid Player)
As a User,
I want to play my stories smoothly whether they are on my device or in the cloud,
So that I don't have to worry about where the file is stored.

**Acceptance Criteria:**
**Given** I tap a story to play
**When** the player activates
**Then** the system automatically determines the source (local `file://` or remote `https://`)
**And** if remote, it buffers and streams the audio via `expo-audio-studio` / `expo-av`
**And** I can control playback with large Play/Pause buttons (>48dp) and a draggable seek bar

### Story 3.3: 删除保护与撤销 (Soft Delete + Undo)
As a Senior User,
I want to delete stories I don't like, but have a chance to regret it,
So that I don't accidentally lose a precious memory forever.

**Acceptance Criteria:**
**Given** I swipe or tap delete on a story
**When** I confirm the action
**Then** the story is marked as `deleted` (Soft Delete) and hidden from the main list
**And** an "Undo" toast appears for 10 seconds, allowing immediate restoration
**And** verified deleted items are permanently removed by the backend after 30 days

### Story 3.4: 话题探索卡片 (Topic Discovery)
As a Senior User,
I want to flip through interesting questions one by one,
So that I can find inspiration for my next story without feeling overwhelmed by a long list.

**Acceptance Criteria:**
**Given** I am on the Topics tab
**When** I view the suggestions
**Then** I see one large Question Card at a time
**And** I can tap "Next" (or swipe) to see a new random question from the local JSON library
**And** I can tap "Record This" to immediately go to the recording screen with that prompt active

### Story 3.5: 编辑故事信息 (标题与备注)
As a Senior User,
I want to rename my stories,
So that I can remember what each recording is about (e.g., "My 10th Birthday").

**Acceptance Criteria:**
**Given** I am viewing a finished story
**When** I tap the "Edit" button
**Then** I can modify the default title (e.g., "Story 2024-01-01") to a custom name
**And** the change is saved locally and queued for sync
**And** the keyboard interaction does not obscure the input field

### Story 3.6: 离线访问策略
As a User,
I want to know which stories I can play when I have no internet,
So that I don't get frustrated trying to play something that won't load.

**Acceptance Criteria:**
**Given** the device is offline
**When** I view the gallery
**Then** cloud-only stories are visually dimmed or marked "Online Only"
**And** tapping them shows a friendly "Please connect to internet" message
**And** local stories remain fully playable

---

## Epic 4: 家人收听与互动

家人用户可以查看、播放父母的故事，发表评论。长者用户可以看到家人的评论。

### Story 4.1: 家人故事列表 (Remote View)
As a Family User,
I want to see the list of stories my parent has recorded,
So that I can catch up on their latest updates.

**Acceptance Criteria:**
**Given** I log in to the family app
**When** the home screen loads
**Then** I see the shared timeline of the senior user
**And** I see a prompt to granting Notification permissions (if not already granted)
**And** RLS policies ensure I only see stories from the account I am linked to

### Story 4.2: 安全云端播放器 (Secure Streaming)
As a Family User,
I want to listen to the stories securely,
So that I know our family privacy is protected.

**Acceptance Criteria:**
**Given** I tap a story in the list
**When** the player requests the audio
**Then** the backend generates a time-limited Signed URL (valid for 1 hour)
**And** the player streams the audio using this secure link
**And** public access to the storage bucket remains disabled

### Story 4.3: 实时评论系统
As a Family User,
I want to leave textual comments on a story,
So that I can share my thoughts or ask follow-up questions.

**Acceptance Criteria:**
**Given** I am listening to a story
**When** I type a comment and hit send
**Then** the comment is inserted into the real-time database
**And** it appears immediately in the comment thread (Optimistic UI)

### Story 4.4: 长者端互动反馈 (评论)
As a Senior User,
I want to see what my family thinks of my stories,
So that I feel connected and encouraged.

**Acceptance Criteria:**
**Given** I am viewing my story gallery
**When** a story has new interactions
**Then** I see a distinct badge showing new comments
**And** tapping the card reveals the comments and total comment count

### Story 4.5: 快速回应 (Reactions)
As a Family User,
I want to quickly "Heart" or "Like" a story with one tap,
So that I can show I'm listening even when I'm busy.

**Priority:** Post-MVP

**Acceptance Criteria:**
**Given** I am on the player screen
**When** I tap the Heart icon
**Then** a "Like" is recorded for that story
**And** the heart icon animates (e.g., fills red) to confirm the action

---

## Epic 5: 通知与参与度

系统发送评论通知给长者与新故事通知给家人，App 内显示未读徽章。家人用户可以向主题库提交新问题。    

### Story 5.1: 新故事通知事件 (Deep Link Payload)
As a Family User,
I want a notification event created when a new story is uploaded,
So that the notification engine can deliver it with deep-link data.

**Acceptance Criteria:**
**Given** the senior user finishes uploading a story
**When** the processing is complete
**Then** a notification event record is created with recipient, story id, topic,
 and deep link target
**And** the event is ready for delivery by the notification engine

### Story 5.2: 首页动态提示 (Contextual Insights)
As a Senior User,
I want to see important updates directly on my home screen,
So that I don't have to dig through menus to know if my family interacted with me.

**Acceptance Criteria:**
**Given** I open the app and have unread interactions
**When** the Home screen loads
**Then** I see a prominent "Activity Card" at the top (e.g., "Alice liked your story")
**And** tapping it takes me directly to the relevant content
**And** once viewed, the card disappears or moves to history
**And** the App Icon shows a numeric badge (FR25) matching the unread count

### Story 5.3: 智能通知引擎 (To Senior)
As a Senior User,
I want to be notified about family activities without being overwhelmed,
So that I feel cared for but not pestered.

**Acceptance Criteria:**
**Given** family members are commenting or liking
**When** multiple events happen within a short window (e.g., 5 mins)
**Then** the system groups them into a single push notification ("3 new comments from Family")
**And** notifications are only sent during my active hours (e.g., 9:00 - 20:00 local time)

### Story 5.4: 情感化唤醒 (Gentle Nudge)
As a Senior User,
I want a gentle reminder if I haven't recorded in a while,
So that I remember to keep sharing my life story.

**Priority:** Post-MVP

**Acceptance Criteria:**
**Given** I haven't opened the app for 3 days
**When** it's morning (10:00 local time)
**Then** I receive a gentle prompt (e.g., "Good morning, do you have a story for today?")
**And** tapping it opens the Topic Selection screen

### Story 5.5: 家人出题与灵感库 (Family Prompts)
As a Family User,
I want to ask my parent specific questions, sometimes using suggested ideas,
So that I can learn about parts of their life I don't know yet.

**Acceptance Criteria:**
**Given** I am in the "Ask" section
**When** I browse the "Inspiration Library"
**Then** I can select a pre-written question (e.g., "What was your first job like?")
**And** I can edit it or write my own custom question
**And** submitting it adds it to the senior's Topic list with a specific "From Family" tag

### Story 5.6: 个性化主题推荐
As a Senior User,
I want to see questions my family asked me first,
So that I can prioritize answering what they are curious about.

**Acceptance Criteria:**
**Given** there are pending questions from family
**When** I switch to the "New Topic" tab or shuffle topics
**Then** questions submitted by family appear with higher priority than random library questions
**And** they are visually distinct (e.g., "Asked by Alice")

### Story 5.7: 新故事推送通知 (Family)
As a Family User,
I want to be notified when a new story is uploaded,
So that I can listen to it right away.

**Acceptance Criteria:**
**Given** a new story notification event is created (Story 5.1)
**When** the notification engine processes the event
**Then** I receive a push notification: "Dad just told a story about [Topic]"
**And** tapping the notification opens the App directly to that story's playback page (Deep Link)



