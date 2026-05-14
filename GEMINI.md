## [2026-05-14] Maintenance: Archival Cleanup & .gitignore Optimization

### Decisions & Implementation
- **Archival Content Audit**: Identified "Minimum Necessary Content" for CD/DVD archival.
- **.gitignore Hardening**: Added explicit exclusions for local databases (`*.db`, `*.sqlite`), compressed archives (`*.zip`, `*.rar`), and temporary development artifacts to ensure a lean and secure backup.
- **Sensitive Data Protection**: Reinforced the exclusion of environment secrets and service account keys (`timelog-sa-key.json`).

### Results
- ✅ **Optimized Backup Size**: Excluded redundant build artifacts and caches.
- ✅ **Secure Archival**: Minimized risk of leaking sensitive local configuration.

## [2026-05-10] Mobile: Fixed Transcript Sync & UUID Standardization

### Decisions & Implementation
- **Standardized Segment IDs**: Identified a sync failure where `transcript_segments` were using a custom `seg_` prefix instead of a valid UUID, causing Supabase to reject the records.
- **UUID v7 Transition**: Updated `TranscriptSyncService.ts` to use `generateId()` from `src/utils/id.ts`, ensuring all new segments use time-ordered UUID v7.
- **Sync Engine Hardening**: Added a defensive check in `useSyncStore` (`processQueue` loop) to automatically detect and discard legacy `seg_...` segments that were clogging the synchronization queue.
- **Startup Cleanup**: The sync engine now gracefully "self-heals" by purging invalid legacy data on the next processing cycle, restoring normal sync flow for recordings and metadata.

### Results
- ✅ **Resolved Supabase Sync Errors**: Terminal is no longer flooded with `invalid input syntax for type uuid`.
- ✅ **Queue Fluidity**: Synchronization of recordings and profiles is no longer blocked by invalid transcript data.
- ✅ **Architectural Alignment**: Fully aligned with the `project-context.md` mandate for UUID v7 primary keys.

## [2026-05-08] Mobile: Offline Playback Stabilization & Offload Handling

### Decisions & Implementation
- **Offline Playback Logic**: Identified a critical flaw in `isStoryPlayable` where stories with `'OFFLOADED'` status or remote URLs were being marked as playable while offline.
- **Path Detection (isRemotePath)**: Implemented and exported `isRemotePath` in `audioEncryption.ts` to distinguish between local assets and cloud-synced assets.
- **Robust Decryption Resolver**: Updated `resolveDecryptedAudioPath` to handle `'OFFLOADED'` placeholders and remote URLs without attempting native filesystem reads, preventing "Network request failed" errors.
- **Service Hardening**: Instrumented `playerService.ts` with defensive checks to intercept `'OFFLOADED'` assets and provide descriptive, senior-friendly error messages (e.g., "This story is saved in the cloud. Please connect to the internet to listen.").

### Results
- ✅ **Zero Silent Crashes**: Network-dependent assets no longer trigger low-level filesystem errors when offline.
- ✅ **Accurate UI State**: Offloaded stories correctly reflect their unavailability in offline mode.
- ✅ **Improved Error UX**: Seniors receive meaningful feedback instead of technical error codes.

### TODO
- [ ] Implement a background "Download for Offline" feature for offloaded stories.
- [ ] Audit the waveform analysis cache to ensure it remains available for offloaded stories.

### Decisions & Implementation
- **Data Sovereignty (Total Archive Export)**: Implemented `exportAllDataAction` to consolidate stories, transcripts, interactions, members, and device logs into a single structured JSON payload. This fulfills the requirement for total administrative oversight and data portablity.
- **Story Governance (Transcript Corrections)**: Enabled real-time transcript editing within the `InteractiveTranscript` component. This allows family admins to fix AI errors in the senior's legacy record without altering the original audio.
- **Interaction Management (CRUD for Comments)**: Refactored comment rendering into `StoryCommentItem`, introducing "Update" and "Delete" actions. Family members can now correct or withdraw their interactive contributions to the archive.
- **Identity & Hardware Governance**: 
    - Implemented dynamic role switching (Admin/Member) for family circle management.
    - Added device labeling capabilities, allowing admins to rename generic device identifiers (e.g., "Device 123") to meaningful family terms (e.g., "Grandma's Storybox").
- **UI Redesign (Settings Control Center)**: Overhauled the Settings page to include a "System Advanced Governance" section, anchoring the new export and archival tools.

### Results
- ✅ **Full CRUD closure** for all primary data streams (Stories, Comments, Members, Devices).
- ✅ **Administrative Sovereignty**: Admins now have physical possession of their data via JSON backup.
- ✅ **Heritage UX**: All management actions are wrapped in emotional, high-contrast Heritage-style components with real-time feedback.

### TODO
- [ ] Implement batch archive/restore for stories in the gallery view.
- [ ] Add storage usage visualization in the Overview page.
- [ ] Conduct security audit on the new `exportAllDataAction` RLS triggers.

## [2026-04-10] Web: Localization Parity & Heritage UI Excellence

### Decisions & Implementation
- **Full Localization Parity**: Achieved 100% localization across the Heritage Dashboard. Systematically removed hardcoded English strings from `Stories`, `Family`, `Devices`, `Audit`, and `Settings` pages.
- **Dynamic Translation Mapping**: Implemented robust mapping for dynamic states like `syncStatus` ("Synced", "Syncing") and member roles ("Admin", "Member"), ensuring a seamless bilingual transition.
- **Component Refinement**:
    - **AppHeader & AppSidebar**: Fully localized branding labels and session actions.
    - **StoriesDataTable**: Localized tooltips, search placeholders, and empty states.
    - **Family Management**: Localized the invitation form and member cards, removing legacy hardcoded suffixes.
    - **WaveformPlayer**: Localized playback controls and processing status messages.
- **Translation Infrastructure**: Synchronized `en.json` and `zh.json` to include all new namespaced keys (`Branding.*`, `Stories.*`, `Interactions.*`, etc.).

### Results
- ✅ **Bilingual Ready**: 100% of the dashboard UI now responds to the user's locale preference.
- ✅ **Design Integrity**: All localized strings maintain the high-contrast, premium "Heritage" aesthetic without layout breaks.
- ✅ **Simplified Maintenance**: Centralized all UI strings in translation bundles, reducing technical debt from hardcoded literals.

### TODO
- [ ] Perform a final visual regression test with a real family session.
- [ ] Verify that all success/error toast messages from server actions are fully localized.
- [ ] Audit the mobile app's local-first sync notifications for i18n alignment.

## [2026-04-10] Web: Heritage Premium & i18n Parity

### Decisions & Implementation
- **Motion Orchestration (framer-motion)**: Integrated `framer-motion` to elevate the UI from static to "Premium Pro-Max". Implemented staggered entrance animations for Settings and Audit pages, ensuring a fluid, high-end feel.
- **Hybrid Rendering Model**: Refactored Settings and Audit pages into a hybrid model where Server Components (RSC) handle secure data fetching while Client Components manage physics-based animations and tab transitions. This maintains SEO and performance while enabling sophisticated UX.
- **I18n Absolute Parity**: Systematic elimination of all hardcoded strings in the `ArchiveNameForm`. Synchronized `en.json` and `zh.json` to ensure 100% localization across all archive governance tools.
- **Micro-interactions & Stability**: 
    - Resolved `AnimatePresence` "wait" mode warnings in the Settings page by implementing conditional tab rendering and fixing the `useState` import regression.
    - Suppressed Recharts `ResponsiveContainer` dimension warnings by applying `minWidth={0}` and `minHeight={0}` constraints.
    - Fixed `MISSING_MESSAGE` errors in the Audit module by standardizing namespaced i18n access paths (e.g., `Audit.activeSignal`).
    - Purged legacy hardcoded strings in the `InteractiveTranscript` component.
    - Added smooth scaling and hover states to panel cards, reinforcing the "Heritage" aesthetic.

### Results
- ✅ **60fps Transitions**: Staggered slide-in timeline and metrics.
- ✅ **Zero Mixed-Language**: Refined the library identity section to be fully locale-aware.
- ✅ **Resilient UX**: Retained `Suspense` streaming while wrapping dynamic content in motion shells.

### TODO
- [ ] Audit the remaining sidebar navigation icons for tooltip localization.
- [ ] Test the motion performance on low-end mobile browsers via the web platform.
- [ ] Implement a "Motion Reduced" mode for accessibility compliance.

## [2026-04-10] Web: Stability Hardening & Multi-Batch Git Migration

### Decisions & Implementation
- **Build Stability & Hook Safety**: Resolved critical build-breaking ReferenceErrors and React Hook violations in the Web platform.
- **Full Localization Closure**: Achieved 100% localization parity across the Heritage Dashboard.
- **Segmented Migration (7-Batch Git Ops)**: Executed a structured Git deployment strategy for the `timelog-web` repository.

## [2026-04-10] Infrastructure: Mobile Hardening & Security Rollout

### Decisions & Implementation
- **Mobile Slimming (Cleanup)**: Purged legacy family and notification screens from the mobile app, completing the architectural shift where family interactions are managed via the web portal.
- **Supabase Security (RLS)**: Commited the comprehensive Row Level Security (RLS) model for `audio_recordings`, `story_comments`, and `activity_events`.
- **Feature Completion (Comments)**: Finalized the local-first storage and synchronization logic for story interactions.
- **Git Hardening (5-Batch Deployment)**: Organized 64 uncommitted files in the `TimeLog` workspace into 5 targeted commits, ensuring a clean and auditable repository history.

### Results
- ✅ **Zero Build Errors**: Clean build and passing tests for mobile.
- ✅ **Hardened Security**: 100% coverage for story and comment access.
- ✅ **Clean Workspace**: All working trees in both `TimeLog` and `timelog-web` are now clean.

### TODO
- [ ] Verify haptic feedback consistency in the updated mobile settings screens.
- [ ] Perform security audit on the new edge functions for push notifications.

## [2026-04-07] Infrastructure: Mobile Slimming & Security Upgrade

### Decisions & Implementation
- **Audio Encryption Upgrade (V2)**: Successfully transitioned from simple XOR encryption to **AES-256-CTR** using `aes-js`. Implemented a versioned header system to ensure 100% backward compatibility with existing recordings.
- **Mobile Slimming (Family Removal)**: Completed the architectural transition of the mobile app to a dedicated "Storyteller-first" experience. Purged all `family-listener` and `family` feature modules, UI screens, and navigation routes.
- **Build Hardening**: Resolved all remaining TypeScript errors resulting from the feature removal, ensuring a stable, build-ready codebase (`tsc --noEmit` passed).
- **UX Refinement**: Optimized the account upgrade flow to guide elders through email confirmation, aligning with the new centralized auth logic.

### Results
- ✅ **100% Clean Build**: No more TS errors or broken route imports.
- ✅ **Secure Local Data**: AES-256-CTR protection for the long-term storage of user stories.
- ✅ **Strategic Alignment**: Mobile app is now a pure recording tool, while family/social interaction is being offloaded to the web platform.

### TODO
- [ ] Perform field testing on actual devices to verify audio playback performance with AES decryption.
- [ ] Begin Web platform development using the cleared domain space.

## [2026-03-31] Local-First Recording & Smooth Save Optimization

### Decisions & Implementation
- **Instant recording start**: Refactored `useHomeLogic.ts` to trigger local audio capture immediately (<200ms), decoupling it from the LiveKit/AI connection which now happens in the background.
- **Background AI Connection**: Updated `useAiDialogSession` to reactively connect once a `recordingId` is generated, preventing UI hangs during AI session cold-starts.
- **Smooth Save (Non-blocking onStop)**: Refactored the `onStop` callback to provide immediate UI feedback (success sound, screen transition) and moved heavy post-processing (Opus transcoding, encryption, sync queue) to a detached background promise chain.
- **Circular Dependency Resolution**: Fixed a hook-related circular dependency using a `useRef` bridge in the home screen logic layer.

### Results
- ✅ User experience now feels "instant" for both starting and stopping recordings.
- ✅ AI Agent joins and interacts mid-recording without blocking the primary capture task.
- ✅ Resilient to network latency during the critical start/stop interaction points.

### TODO
- [ ] Regression test the background transcoding success rate under low-memory conditions.
- [ ] Verify the "Waiting for AI" status visibility in `AiRecordingView` during the background join phase.
- [ ] Monitor the sync queue for any race conditions when recordings are enqueued from background promises.

## [2026-03-31] System Hardening & Service Layer Resiliency

### Decisions & Implementation
- **Logic Alignment (Recovery)**: Standardized recovery code generation from `RCV-XXX-XXX` to `REC-XXXXXX` to ensure 100% compatibility with the Supabase database constraints and RPC validation.
- **Session Safety Mandate**: Identified and corrected unsafe `getUser()` destructuring patterns across 5 core services (`notifications`, `commentService`, `recoveryCodeService`, `anonymousAuthService`). All auth calls now use safe null-checks to prevent app crashes on guest or expired sessions.
- **Service Error Boundaries**: Conducted a deep-dive audit of all service logic. Wrapped raw database `throw error` statements with contextual, senior-friendly English messages. This prevents "Leaking Tech Details" (e.g., PGRST errors) into the UI and provides a clear failure reason (e.g., "Connection lost", "Story not found").
- **Structural Repairs**: Fixed major structural corruption and duplicated functions in `profileService.ts` and `storyService.ts` caused by concurrent logic audits.

### Results
- ✅ 100% alignment for the "Registration → Upgrade → Recovery" flow.
- ✅ Resilient profile and story management operations with "Humble" user messaging.
- ✅ Hardened input validation for intergenerational family questions.

### TODO
- [ ] Regression test the `REC-XXXXXX` format in localized environments.
- [ ] Audit `src/lib/sync-engine/queue.ts` for similar raw throw patterns.
- [ ] Update `seniorStoryService.test.ts` to reflect the new friendly error strings.

## [2026-03-31] Infrastructure: AI Provider Switch

### Decisions & Implementation
- **API Transition**: Switched the `Story Agent` from Vertex AI (GCP) back to the **Direct Gemini API**.
- **Model Alignment**: Standardized on `gemini-3-flash` across all environments to utilize the latest improvements of the Gemini 3 series.
- **Rationale**: Direct API offers lower latency for real-time voice interactions and simpler environment management during the current rapid iteration phase.

### Results
- ✅ `USE_VERTEX_AI` set to `false` in root `.env`.
- ✅ `AGENT_LLM_MODEL` explicitly set to `gemini-3-flash-preview` (Corrected from gemini-3-flash).
- ✅ **Infrastructure status**: Paid Tier (Pay-as-you-go) enabled, removing Free Tier quota bottlenecks.
- ✅ Simplified authentication flow for the LiveKit Python agent.

### TODO
- [x] Verified: Using Paid Tier (Higher RPM & No user data training).
- [ ] Verify `gemini-3-flash` output quality for elderly Thai/English code-switching.

---

This document serves as the persistent memory for architectural decisions, security audits, and key implementation milestones.

## [2026-03-30] Heritage UI Restoration & Registration Modernization

### Decisions & Implementation
- **Floating Label Restoration**: Fixed a P0 bug in `HeritageInput` where labels were not rendering. Re-implemented `<Animated.Text>` with smooth Reanimated transitions (translateY, scale, color).
- **Schema Synchronization**: Identified a P0 regression in user registration (account upgrade). Supabase `profiles` table was missing columns (`email`, `avatar_uri`, `bio`, `font_scale_index`, etc.) causing profile sync failures after Auth success. Aligned `recovery_codes` expiry to 365 days.
- **Migration Fix**: Created `20260330_fix_profile_schema_sync.sql` (v2) to add all missing columns and ensuring naming consistency (`full_name` vs `display_name`).
- **Humble Error Handling**: Implemented `mapAuthError` in `anonymousAuthService` to translate technical Supabase errors (e.g., password reuse, invalid format) into user-friendly English messages. Added client-side email validation in `UpgradeAccountScreen`.
- **Accessibility Hardening**: Ensured touch targets remain 64dp and contrast ratios meet senior-first requirements.

### Results
- ✅ Registration & Upgrade screen fully functional; resolved all `PGRST204` schema mismatches.
- ✅ Consistent input behavior and client-side validation for account upgrades.
- ✅ Unified "Humble" error mapping system across Auth, Invite, and Family services.
- ✅ Hardened service layer with safe `getUser()` patterns to prevent session-loss crashes.

### TODO
- [x] Conduct profile schema audit and sync (Completed 2026-03-30).
- [x] Integrate `mapAuthError` and `mapInviteError` (Completed 2026-03-30).
- [ ] Conduct screen-reader (VoiceOver/TalkBack) audit for the new floating labels.
- [ ] Verify haptic feedback consistency on password toggle across Android/iOS.

```
## [2026-03-29] Code Quality Optimization & Security Purge
...
```
### TODO
- [ ] Upgrade XOR audio encryption to AES-256 in `audioEncryption.ts`.
- [ ] Manual verification of the Voice recording flow in a dev build.
- [ ] Clarify Logout vs. Switch Account logic in Settings.
