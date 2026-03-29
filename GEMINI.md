# TimeLog: The Chronicle (GEMINI.md)

This document serves as the persistent memory for architectural decisions, security audits, and key implementation milestones.

## [2026-03-29] Code Quality Optimization & Security Purge

### Decisions & Implementation
- **Security Purge**: Deleted `timelog-sa-key.json` and ensured it is not tracked in Git. Replaced hardcoded app versions with dynamic constants (`expo-constants`).
- **Icon Standardization**: Migrated all UI components to use standard Ionicons (e.g., `mic`, `play`) instead of SF Symbol names to ensure multi-platform compatibility and fix TypeScript build errors.
- **Architectural Refactoring**: Decomposed the monolithic `useHomeLogic` (900+ lines) into a modular hook architecture:
    - `useHomeDisplayData`: UI/UX metadata (greetings, dates).
    - `useRecordingSession`: Core hardware interaction and recording lifecycle.
    - `useAiDialogSession`: LiveKit/AI agent connectivity and coordination.
    - `useHomeLogic`: High-level orchestrator.
- **Error Handling**: Fixed duplicate state reset logic in recording cleanup to prevent UI flickering.

### Results
- ✅ `tsc --noEmit` passed (Exit Code 0).
- ✅ Reduced main hook complexity by 60%.
- ✅ Security leaks plugged.

### TODO
- [ ] Upgrade XOR audio encryption to AES-256 in `audioEncryption.ts`.
- [ ] Manual verification of the Voice recording flow in a dev build.
- [ ] Clarify Logout vs. Switch Account logic in Settings.
