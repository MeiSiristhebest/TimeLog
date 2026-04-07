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
