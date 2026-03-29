# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Integrated **Gemini 3 Flash** for life life-logging interactions.
- Added **Deepgram Aura-2** (TTS) and **Nova-3** (STT) for superior voice quality.
- Implemented **Dual-Track Authentication**: Support for standard email/password and hassle-free Device Code login.
- **Local-First Architecture**: Persistent storage with `expo-sqlite` and `Drizzle ORM`.
- **Intelligent VAD**: Tailored silence detection (3-5s) for elderly speech patterns.
- **Actionable Toast System**: Support for interactive notifications with CTA buttons.
- **Branded Design System**: "Heritage" design tokens for visual consistency.

### Changed
- Refactored AI recording flow to use sequential startup (Connect AI -> Local Recorder).
- Updated transcription segment management to prevent database unique constraint violations.

### Fixed
- Resolved microphone hardware contention issues on mobile devices.
- Corrected date formatting inconsistencies across different locales (standardized on en-US).
