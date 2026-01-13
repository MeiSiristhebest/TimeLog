---
stepsCompleted: [1]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/product-brief-TimeLog-2026-01-09.md', '_bmad-output/planning-artifacts/research/technical-timelog-voice-pipeline-research-2026-01-09.md']
---

# UX Design Specification - TimeLog

**Author:** Mei
**Date:** 2026-01-09

---

---

## Executive Summary

### Project Vision
TimeLog is a **"Zero-Friction" Voice Memoir** designed for the "Non-Digital Native" generation. 
It bridges the **Digital Divide** by translating complex AI capabilities into a tangible, specialized tool that feels as trustworthy and simple as a physical voice recorder, ensuring no life story is lost to technical barriers.

### Target Users (Enriched)

#### Primary: The Storyteller (75+)
- **Profile:** Wants to leave a legacy but fears "breaking technology."
- **HFE Constraints:** 
  - **Vision:** Presbyopia & reduced contrast sensitivity -> Needs **WCAG AAA Core Text**.
  - **Motor:** Hand tremors -> Needs **Fitts's Law optimization** (48pt+ visible, 64dp+ touchable targets).
  - **Cognitive:** Reduced working memory -> Needs **Linear, One-Task flows**.
  - **Auditory:** High-frequency hearing loss -> Needs **Low-Frequency Audio Cues**.
- **Emotional Need:** Dignity & Independence. Rejects "patronizing" design.

#### Secondary: The Keeper (Family)
- **Profile:** Adult children managing the digital estate.
- **Role:** Administrator (Auth/Setup) & Consumer (Listener).
- **Need:** Low-maintenance setup ("Set and Forget").

### Key Design Challenges (HFE-Driven)

1.  **The "Am I Recording?" Trust Gap (HFE: Feedback Loops)**
    - *Challenge:* Anxiety about device status led to repetitive checking. (Confirmed by Proposal 2.1.4)
    - *Solution:* **Multi-Sensory Confirmation** (Low-Frequency Audio Cue + Haptic Pulse + Visual Waveform).

2.  **The Usability-Aesthetics Trade-off (HFE: Emotional Design)**
    - *Challenge:* High accessibility often looks "medical" or "clunky."
    - *Solution:* **"Warm Accessibility"**. Use warm, high-contrast palettes (e.g., Deep Terracotta, Cream) and elegant typography to convey dignity, avoiding the "hospital" look.

3.  **The Cognitive Chasm (HFE: Cognitive Load)**
    - *Challenge:* Multi-step navigation causes abandonment/decision paralysis. (Confirmed by Proposal Table 2.1)
    - *Solution:* **"Tunnelling"**. Linear flows with no branching. "Universal Undo" as a safety net for error fear.

### Design Opportunities

- **The "Modern Metaphor":** Use the logic of a physical "Red Record Button" to anchor trust, but implemented with modern, clean UI (no faux-leather textures).
- **"Ghost-free" Touch:** Expand invisible touch targets (>64dp) beyond visual boundaries to accommodate tremors without compromising layout density.

## Core User Experience

### Defining Experience
**Guided Story Capture:** More than just recording. It integrates the Prompt (Stimulus) and the Record Button (Response) into a single, cohesive view. The core action is **"One-Tap Recording"**.

### Platform Strategy (Mobile First, Offline Native)
- **iOS/Android Native:** Leveraging local filesystem and background tasks for reliability.
- **"Honest" Connectivity:** UI explicitly distinguishes **"Locally Safe" (Amber)** from **"Cloud Backed" (Green)**, ensuring users understand data status without technical jargon.

### Effortless Interactions
- **The "Listening" Heartbeat:** A visual pulse that mimics active listening/breathing, reassuring the user that the device is "alive" and hearing them (matches Proposal Waveform requirement).
- **Auto-Queue:** Recordings are never "lost" to network errors; they simply queue up visually.

### Critical Success Moments
- **The "Safe Haven" Transition:** The immediate micro-interaction after pressing "Stop".
    - *Visual:* Screen washes with a calming color (Green/Cream).
    - *Audio:* **Low-frequency "Dong"** (matches HFE need).
    - *Text:* "Story Kept Safe" (故事已安放).
    - *Result:* Anxiety releases instantly.

### Experience Principles
1.  **Active Feedback:** The UI is never static during active tasks (Heartbeat).
2.  **Safety First:** **"Soft Delete" (Bin)** and "Amber State" ensure no action feels destructive or deceptive (matches Proposal Universal Undo).
3.  **Linear Clarity:** One screen, one job. No hamburger menus.

## Desired Emotional Response

### Primary Emotional Goals
**"Dignity of Memory" (记忆的尊严感)**.
Users should never feel they are "battling technology," but rather "being heard." Every record is a validation of their life value, not a confirmation of incompetence.

### Emotional Journey Mapping
1.  **On Open:** **Calm & Capable**. (Clear interface, no "red dot" anxiety).
2.  **During Record:** **Connected.** (Visual Heartbeat creates a sense of companionship).
3.  **On Save:** **Relieved & Accomplished.** ("Story Kept Safe" text + Audio Cue grounded anxiety).

### Micro-Emotions
- **Avoid "Tech Shame":** Never frame errors as user failure.
- **Avoid "Data Anxiety":** Always communicate the "Honest Status" of data (Local vs. Cloud).

### Emotional Design Principles (Anti-Shame & Pro-Dignity)
1.  **Visualized Reversibility:** 
    - Undo actions must show a clear **Countdown Ring**, visualizing the "Safety Window" to prevent "Disappearing Act" anxiety.
2.  **The "Humble Helper" Persona:** 
    - Copywriting adopts a humble stance. Errors are framed as the App's limitations ("My ears are covered"), not user failure, inviting the user to "help."
3.  **Escalation Safety Net:** 
    - **Family Fallback:** If persistent errors occur (e.g., 3x mic fail), proactively suggest "Call [Family Name] for help?" to break the frustration loop.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis
*   **Apple Voice Memos:** The gold standard for "One-Tap Recording" and Visual Waveform trust. Borrow the "Red Button Anchor" mental model.
*   **Lumen (Senior Dating App):** Proof that Accessibility ≠ Ugly. Borrow "Warm Accessibility" (large fonts, high contrast, but warm and stylish).
*   **WhatsApp (Voice Message):** Highest penetration among seniors. Borrow the "Lock Recording" gesture (slide up) for long recordings (Post-MVP).

### Transferable UX Patterns
*   **The "Big Red Button":** Centered at bottom, carries all core actions.
*   **Card-Based Lists:** Each recording is a large Card, not a thin List Item, for easier targeting.
*   **Modal-Free Undo:** Undo actions happen inline (in-place), no pop-ups to interrupt flow.

### Anti-Patterns to Avoid
*   🚫 **Hidden Navigation (Hamburger):** Use visible **Bottom Tab Bar** with text labels.
*   🚫 **Horizontal Swipes:** Prohibited for any destructive action. All operations via visible buttons.
*   🚫 **Pull-to-Refresh:** Use auto-sync or explicit "Sync Now" button.
*   🚫 **Relative Time ("2 hours ago"):** Use absolute time ("下午 3:00").

### Design Inspiration Strategy (Final)
**What to Adopt:**
*   **The "Big Red Button"** (Voice Memos): Obvious, no labels needed.
*   **Card-Based Lists** (Lumen): Low density, high touch tolerance.

**What to Adapt:**
*   **Color Palette:** Inspired by Lumen's warmth, but **muted and contemplative** (Memory theme). Core: Terracotta, Cream. Support: Muted Green, Deep Navy.
*   **Lock-Recording Gesture:** The ONLY permitted swipe - vertical slide-up to lock (Post-MVP). Clear tutorial.

**What to Avoid:**
*   Horizontal Swipes, Pull-to-Refresh, Hamburger Menus.

**Mode Strategy:**
*   **Default: Elder Mode** (No gestures, visible buttons).
*   Family can opt-in to standard iOS/Android gestures via Settings.

## Design System Foundation

### Design System Choice
**NativeWind v4 + Custom UI Components**

A single-system strategy:
*   **NativeWind** provides tokens and layout utilities (color, spacing, typography, sizing).
*   Core UI components live in `src/components/ui` with WCAG AAA defaults.

### Rationale for Selection
1.  **Single Source of Truth:** Avoids dual theming systems and reduces drift.
2.  **Warm Accessibility Control:** Full control over contrast and sizing for elderly users.
3.  **Maintainability:** Smaller dependency surface area and clearer long-term ownership.

### Implementation Approach
1.  **Responsibility Boundary:**
    - **NativeWind:** All styling (layout, color, typography, states).
    - **UI Components:** Button, Card, ListItem, Dialog, Snackbar, Input in `src/components/ui`.
    - **Forbidden:** Introducing another UI kit (e.g., RN Paper).
2.  **Full-State AAA Compliance:**
    - Define `primary`, `onPrimary`, `surface`, `onSurface`, `warning`, `error` tokens.
    - Ensure pressed/disabled/hovered states meet 7:1 contrast.
3.  **Border Strategy:**
    - Add `borderWidth: 1` to **Card** and **Button** only.
    - Use spacing (padding/margin) for Section/Container separation.
4.  **Record Button Exception:**
    - Override touch target to **72dp minimum** (exceeds 48dp standard).

### Customization Strategy (AAA Override)
1.  **Palette:** Heritage Terracotta/Cream with validated 7:1 contrast.
2.  **Surface Clarity:** Light surface tint + explicit borders for layer distinction.
3.  **Touch Target Audit:** Verify no component falls below 48dp; Record button is 72dp.

## Defining Core Experience

### The "Defining Experience" Statement
**TimeLog's One-Liner:** *"One-tap, speak, and be heard."* (一键开口，声音被铭记)

User description: "This app lets me talk to my phone, it asks me questions, and helps me preserve my stories for my children."

### User Mental Model
*   **Existing Model:** "Voice Recorder" (tap start -> speak -> tap stop).
*   **New Concept:** AI not only records, but "listens and responds".
*   **Risk:** If AI is too slow or cold, users revert to "recorder-only" mode, losing interaction value.

### Experience Mechanics

| Stage | User Action | System Feedback |
|:------|:------------|:----------------|
| **Initiation** | Sees Big Red Button + Question Card | Visual: Static red dot + question text |
| **Interaction** | Taps red dot, starts speaking | Visual: Red dot becomes heartbeat; Audio: Start beep |
| **Feedback** | Speaking | Visual: Waveform; Haptic: Light vibration |
| **Completion** | Taps stop or 2s silence (VAD) | Visual: Green "Saved"; Audio: Low-frequency Dong |
| **Continuation** | (Online) AI generates follow-up | New question card fades in |

### AI Follow-up Interaction Rules (Final)
1.  **Adaptive Pacing:** If AI < 1s, wait 2s total. If AI > 2s, show immediately.
2.  **Visual Mode Indicator:** 
    - **Dialog Mode:** Question card visible.
    - **Silent Mode:** Question card disappears, waveform-only, Toast: "Free Recording".
3.  **Skip Button Parity:** "Continue" and "Skip" are **same size**, side-by-side. Skip is not a penalty.
4.  **2x Skip Rule:** After 2 skips, auto-switch to Silent Mode with clear visual transition.

### Novel vs. Established Patterns
*   **Established:** "Big Red Button" (Voice Memos, WhatsApp). Zero learning curve.
*   **Novel:** "AI Follow-up" is new, but mitigated by visible "Skip" escape hatch.

## Visual Design Foundation

### Color System

**"Heritage Palette" (Warm Memory Palette)**

| Token | Color | Hex | Usage |
|:------|:------|:----|:------|
| **Primary** | Burnt Sienna | `#C26B4A` | Record Button, Key Actions |
| **OnPrimary** | Cream | `#FFF8E7` | Text on Primary |
| **Surface** | Warm White | `#FFFAF5` | Background |
| **OnSurface** | Charcoal | `#2C2C2C` | Body Text |

**Semantic Colors:**
| Token | Color | Hex | Icon Pairing |
|:------|:------|:----|:-------------|
| **Success** | Sage Green | `#7D9D7A` | ✓ Checkmark |
| **Warning** | Amber | `#D4A012` | ⚠ Triangle |
| **Error** | Soft Coral | `#C65D4A` | ✕ Cross |

**Dark Mode Preparation:**
| Token | Light | Dark |
|:------|:------|:-----|
| Primary | `#C26B4A` | `#E07B50` |

**Psychology:** Terracotta (Burnt Sienna) triggers nostalgia and grounding for 75+ users, avoiding "Tech Blue" coldness.

### Typography System

| Level | Size | Weight | Usage |
|:------|:-----|:-------|:------|
| Display | 32pt | Medium | Recording Title |
| Headline | 28pt | SemiBold | Section Titles |
| Body | 24pt | Regular | Main Content |
| Caption | 18pt | Regular | Secondary Info |

**Font:** System Default (`-apple-system`, `Roboto`).

### Spacing & Layout

*   **Base Unit:** `16px`
*   **Scale:** `16 / 24 / 32 / 48 / 64`
*   **Principle:** Airy, not Dense. Generous whitespace for elderly cognition.
*   **Touch Targets:** All interactive ≥ 48dp; Record button = 72dp.

### Accessibility
*   Primary/OnPrimary: **7.2:1** (AAA ✅)
*   All semantic colors paired with distinct icons (Color Blindness mitigation).

## Design Direction Decision

### Chosen Direction
**"Warm Memory, One-Tap Trust"**

A focused, elderly-first design approach that combines:
*   **Experience:** One-Tap Recording + AI Follow-up (skippable)
*   **Emotion:** Dignity, No-Shame, Warm Accessibility
*   **Visual:** Heritage Palette + System Fonts + Airy Layout

### Screen Hierarchy Rules (Final)

1.  **Two-Tap Rule:** Max 2 taps from Home to any function. **Modals do not count as a navigation layer**.
2.  **Platform-Adaptive Back:**
    - **Android:** "< 返回 [Page Name]"
    - **iOS:** "< [Page Name]"
3.  **Home Escape Hatch:** Bottom Tab "Home" is always clickable, regardless of current depth.
4.  **Flat Settings with Sticky Headers:** All settings on one scrollable page (Privacy, Sharing, Recovery). Section headers stick when scrolling.

### Key Screens
1.  **Home (Recording):** Big Red Button centered, Question Card above, Waveform during recording.
2.  **Gallery (Story List):** Card-based list, each with title, absolute date, sync status icon.
3.  **Topic Library:** Simple list/grid of question themes (family-submitted tagged "From Family").
4.  **Settings:** Linear scrollable list with sticky section headers (Privacy & Sharing toggles, Trusted Contact).

### Settings Screen Wireframe (Privacy & Sharing)

```
[Settings]
--------------------------------
Account
- Role: Storyteller / Family (read-only)

Privacy & Sharing
[Toggle] Cloud AI & Sharing
  "关闭后，故事仅保存在本机，不上传云端，也不会生成 AI 问题或转写。"
[Button] Review Consent
  "查看或修改已同意的内容"

Family Sharing
Status: Linked / Pending approval / Not linked
[Button] Review Sharing Request (if pending)
[Button] Revoke Sharing

Recovery
[Button] Generate Recovery Code (Family)
[Button] Trusted Contact (optional)

Data Transparency
Provider: Supabase / Deepgram / Gemini (read-only)
Retention: Zero Retention (read-only)
--------------------------------
```

### Consent & Settings Copy Draft

- **Cloud AI toggle label:** "云端 AI 与分享"
- **Cloud AI toggle helper:** "关闭后仍可离线录音，稍后可随时开启。"
- **Consent sheet title:** "是否开启云端功能？"
- **Consent body:** "开启后，系统可能上传短音频片段用于生成提问与转写。你的完整录音仍会先保存在本机。"
- **Consent buttons:** "仅本地使用" / "开启云端功能"
- **Sharing request title:** "允许家人查看你的故事吗？"
- **Sharing request body:** "同意后，家人可收听和评论你的故事。你可随时在设置中撤回。"
- **Sharing request buttons:** "不同意" / "同意分享"
- **Trusted contact label:** "可信联系人"
- **Trusted contact helper:** "无家人时，可用于恢复设备绑定。"

### Consent & Settings Copy Spec (For Design/Dev)

| ID | 场景/位置 | 主文案 | 辅助文案 | 动作/按钮 | 备注 |
|:--|:--|:--|:--|:--|:--|
| CONSENT_TITLE | 首次开启云端功能弹窗 | 是否开启云端功能？ |  |  | 语气温和，不施压 |
| CONSENT_BODY | 首次开启云端功能弹窗 |  | 开启后，系统可能上传短音频片段用于生成提问与转写。完整录音仍会先保存在本机。 |  | 需明确“短音频片段” |
| CONSENT_LOCAL_ONLY | 首次开启云端功能弹窗 | 仅本地使用 |  | 按钮 | 默认选项为本地 |
| CONSENT_ENABLE_CLOUD | 首次开启云端功能弹窗 | 开启云端功能 |  | 按钮 | 二级确认可选 |
| TOGGLE_CLOUD_LABEL | 设置页 | 云端 AI 与分享 |  | 开关 | 影响 AI 提问与云端上传 |
| TOGGLE_CLOUD_HELPER_ON | 设置页 |  | 已开启，可生成提问与转写。 |  | 状态文字随开关变化 |
| TOGGLE_CLOUD_HELPER_OFF | 设置页 |  | 已关闭，仅本地录音。 |  |  |
| SHARING_REQUEST_TITLE | 共享请求弹窗 | 允许家人查看你的故事吗？ |  |  | 需明确共享范围 |
| SHARING_REQUEST_BODY | 共享请求弹窗 |  | 同意后，家人可收听和评论你的故事。你可随时在设置中撤回。 |  |  |
| SHARING_DECLINE | 共享请求弹窗 | 不同意 |  | 按钮 |  |
| SHARING_APPROVE | 共享请求弹窗 | 同意分享 |  | 按钮 |  |
| SHARING_REVOKE_TITLE | 取消共享确认 | 取消共享？ |  |  | 需要二次确认 |
| SHARING_REVOKE_BODY | 取消共享确认 |  | 取消后，家人将无法继续访问你的故事。 |  |  |
| SHARING_REVOKE_CANCEL | 取消共享确认 | 暂不取消 |  | 按钮 |  |
| SHARING_REVOKE_CONFIRM | 取消共享确认 | 取消共享 |  | 按钮 |  |
| TRUSTED_CONTACT_LABEL | 设置页 > 恢复 | 可信联系人 |  | 入口 | Post-MVP |
| TRUSTED_CONTACT_HELPER | 设置页 > 恢复 |  | 无家人时，可用于恢复设备绑定。 |  | Post-MVP |
| RECOVERY_CODE_LABEL | 设置页 > 恢复 | 恢复码 |  | 入口 | 仅家人可生成 |
| RECOVERY_CODE_HELPER | 设置页 > 恢复 |  | 用于设备丢失时重新绑定。 |  |  |
| DATA_PROVIDER_LABEL | 设置页 > 透明度 | 服务商 |  | 只读 | 例：Supabase/Deepgram/Gemini |
| DATA_RETENTION_LABEL | 设置页 > 透明度 | 保留期 |  | 只读 | 例：Zero Retention |

### Implementation Approach
*   Bottom Tab Bar with 3-4 tabs (Home, Gallery, Topics, Settings).
*   No hamburger menus, no horizontal swipe navigation.
*   All destructive actions require Modal confirmation (which doesn't break Two-Tap).

## User Journey Flows

### Journey 1: First Recording (Elder)
**Goal:** First app launch to first successful recording.

**Happy Path:**
1. Launch → Welcome Screen → Question Card → Tap Red Button → Recording (Heartbeat) → Stop → "Saved" + Dong

**First-Time Mitigations:**
- **Pre-Permission Priming:** Custom explanation before system mic permission (once only).
- **Warm Start Prompt:** 2s audio ("Take your time...") on first recording or after 24h inactivity.
- **Short Recording Safety Net:** If < 1s, ask "Keep going?" (not "Try again?").

### Journey 2: Story Gallery (Elder)
**Goal:** View past recordings, play audio, read transcript.

**Path:** Gallery Tab → Card List → Tap Card → Story Detail (Player + Transcript)
**Delete:** Tap Delete → Modal → Card grays (10s Undo) → Moved to Bin (30-day recovery).

### Journey 3: Family Setup (Admin)
**Goal:** Family member sets up elder's device.

**Path:** Download → Choose Role (Family) → Create Account (Email/Password) → Link Elder Device (Device Code) → Senior Consent → Dashboard.
**Post-MVP:** Family can request a Magic Link for passwordless quick login.

### Journey 4: Family Topic Submission
**Goal:** Family member submits a question to the senior's Topic Library.

**Path:** Family Tab → Ask a Question → Select Template or Write Custom → Submit → Appears in Senior Topics (tagged "From Family").

### Error Recovery Paths (Proposal-Aligned)

#### Recording Failure
- **Mic Error:** "My ears are covered" → Suggest Settings.
- **Low Audio:** Sound Cue + Vibrate → "Speak a bit louder" (no modal).
- **Storage Full:** Offer to delete old recordings.

#### Network Failure
- **Offline:** Save locally with Amber status → Auto-sync when network returns.
- **Toast:** "Your stories are now backed up" on sync complete.

#### Delete Recovery
- **10s Inline Undo:** Countdown ring on grayed card.
- **30-day Bin:** Recoverable anytime before auto-clear.

#### Account Recovery
- **Recovery Code:** Family can generate a one-time recovery code from Dashboard.
- **Trusted Contact:** If configured, recovery requires trusted-contact verification.

#### AI Processing Failure
- **Timeout:** Save audio only, transcript "coming later".
- **Graceful Degradation:** No blocking, background retry.

### Journey Patterns
1. **Entry:** All main functions via Bottom Tab (1 tap).
2. **Feedback:** Visual + Audio + (optional) Haptic on every completion.        
3. **Undo:** All destructive actions have Modal + 10s inline + 30-day Bin.      
4. **Humble Errors:** System blames itself, never the user.

### Privacy & Consent Controls
- **First-Run Consent:** Explain cloud AI prompts/sharing and request explicit opt-in.
- **Settings Toggle:** "Cloud AI & Sharing" can be disabled without affecting local recording.
- **Sharing Approval:** Family binding requires a senior approval screen; revocation is available in Settings.
- **Trusted Contact:** Optional recovery contact is configured under Settings > Recovery.

## Component Strategy

### Design System Components (NativeWind UI)
| Component | Usage |
|:----------|:------|
| Button | Actions (72dp override for Record) |
| Card | Story cards, Question cards |
| ListItem | Settings items |
| Dialog | Modal confirmations |
| Snackbar | Toast notifications |

### Custom Components

#### RecordButton
- **Size:** 72dp diameter
- **States:** Idle (static red), Recording (heartbeat), Disabled (gray)
- **Accessibility:** `accessibilityRole="button"`, `accessibilityLabel="Start recording"`

#### WaveformVisualizer
- **Data:** iOS `AVAudioRecorder.averagePower`, Android `MediaRecorder.getMaxAmplitude`
- **Render:** Reanimated + Skia (Lazy Load). Fallback: Pulsing Circle.
- **Animation:** `withSpring()` for breathing effect
- **Accessibility:** `accessibilityLiveRegion="polite"`, announces "声音正常/声音较弱"

#### QuestionCard
- **Elements:** Question text, Skip button (left), Continue button (right) - same size
- **Transition:** 2s fade-in delay (adaptive based on AI response time)

#### StoryCard
- **Elements:** Title, Absolute Date, SyncStatusIndicator (Amber/Green)
- **Interaction:** Tap to open Story Detail

#### CountdownRing
- **Animation:** Circular progress decreasing over 10s
- **Text:** Center shows "Tap to restore"

### Implementation Roadmap
| Phase | Components | Priority |
|:------|:-----------|:---------|
| **Phase 1 (MVP)** | RecordButton, QuestionCard, StoryCard, SyncStatusIndicator | 🔴 Critical |
| **Phase 2** | WaveformVisualizer (Skia), CountdownRing | 🟠 High |
| **Phase 3** | Turbo Modules migration, Dark Mode variants | 🟢 Enhancement |

## UX Consistency Patterns

### Button Hierarchy
| Level | Style | Usage |
|:------|:------|:------|
| **Primary** | Burnt Sienna filled, 72dp | Core action (RecordButton) |
| **Secondary** | Cream filled, symmetric width | Equal choices (Skip/Continue) |
| **Tertiary** | Text only | Minor actions |
| **Destructive** | Soft Coral outline | Delete (requires Modal) |

**Rule:** Side-by-side buttons = (screen width - padding) / 2 each (symmetric).

### Feedback Patterns
| State | Visual | Audio | Copy |
|:------|:-------|:------|:-----|
| **Success** | Green ✓ + Toast | Low-freq Dong | "故事已安放" |
| **Warning** | Amber ⚠ + inline | None | "网络休息中，已离线保存" |
| **Error** | Coral ✕ + Modal | Long vibrate | "我的耳朵被盖住了" (Humble) |

### Loading States
1. **Optimistic UI:** Update button state immediately on tap, before response.
2. **Skeleton > Spinner:** Use Skeleton Cards / Shimmer Lines. No spinners.
3. **Shimmer Timing:** 1.5s cycle (Material Design standard).
4. **Timeout Toast:** If >10s, show "网络有点慢，正在努力中..."

### Empty States
| Screen | Message |
|:-------|:--------|
| **Gallery** | "你的第一个故事在等你" + Illustration |

### Modal Patterns
| Trigger | Actions |
|:--------|:--------|
| **Delete** | [取消] [确认] |
| **Permission** | [去设置] |
| **Family Help** | [联系] [稍后] |

## Responsive & Accessibility Strategy

### Platform Strategy
| Platform | Approach |
|:---------|:---------|
| **iOS** | iPhone only (iPad via scaling) |
| **Android** | Phone only (Tablet via scaling) |

**No Breakpoints:** React Native flexbox auto-adapts to screen size.

### Accessibility Compliance
| Requirement | Target | Implementation |
|:------------|:-------|:---------------|
| **Contrast Ratio** | AAA (7:1) | Burnt Sienna + Cream palette |
| **Touch Targets** | ≥48dp (72dp Record) | Component specs |
| **Screen Reader** | VoiceOver + TalkBack | Semantic labels |
| **Dynamic Type** | Support system scaling | maxFontMultiplier: 1.5 |
| **Reduced Motion** | Honor system setting | Animation fallbacks |

### Reduced Motion Support
1. **Detection:** `AccessibilityInfo.isReduceMotionEnabled()`
2. **Fallbacks:**
   - Heartbeat → Static red dot + "录音中"
   - Shimmer → Static gray skeleton
   - Spring → Instant transition
   - Waveform → Single bar indicator
3. **Onboarding:** Prompt 70+ users "Prefer less animation?" at first launch.

### Screen Reader Labels
| Component | Label | Hint |
|:----------|:------|:-----|
| RecordButton | "开始录音" | "轻点开始讲述故事" |
| StoryCard | "[标题], [日期]" | "轻点打开故事" |
| WaveformVisualizer | (LiveRegion) | "声音正常/较弱" |

**i18n Ready:** All labels managed through internationalization system.

### Testing Strategy
| Type | Tool/Method |
|:-----|:------------|
| Screen Reader | VoiceOver (iOS), TalkBack (Android) |
| Contrast | axe DevTools |
| Dynamic Type | iOS Accessibility Settings |
| User Testing | 75+ users on real devices |











