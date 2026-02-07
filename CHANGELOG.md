# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive code review and security audit (2026-01-25)
- ESLint `no-console` rule to prevent direct console usage and enforce `devLog` wrapper
- GitHub Actions CI/CD workflows:
  - `ci.yml` - Automated linting, testing, and TypeScript checking
  - `eas-build.yml` - Automated EAS builds on main branch
- `SECURITY.md` - Security policy and vulnerability reporting guide
- Improved disk space checking with fallback mechanism using temp file writes

### Changed

- **BREAKING**: Removed hardcoded Android fallback path in recorder service (now throws error if FileSystem unavailable)
- Replaced all direct `console.log/warn/error` calls with `devLog.*` wrapper for production safety
- Locked production dependency versions (removed `^` prefixes) for build stability
  - Expo packages retain `~` for SDK compatibility
  - Critical libs (@tanstack/react-query, zustand, drizzle-orm) now use exact versions
- Enhanced deprecated FileSystem API handling with proper fallback

### Fixed

- Security: Console logging now properly disabled in production builds via `devLog`
- Security: Removed unsafe hardcoded file paths that could cause cross-device issues

### Security

- Standardized logging to prevent PII/token leakage in production
- Added automated security checks in CI pipeline
- Documented security best practices for contributors

## [1.0.0] - 2026-01-15

### Added

- Initial release of TimeLog
- Voice-first elderly storytelling app
- Device code authentication for elderly users (QR code login)
- Email/password authentication for family members
- Voice recording with optimized VAD (3-5s pause tolerance)
- Offline-first architecture with SQLite + Drizzle ORM
- Sync queue for offline operations
- Family sharing and collaboration features
- Story gallery with playback controls
- Comments and reactions on stories
- Smart notification system
- Heritage Memoir design system
- Accessibility compliance (WCAG 2.2 AAA)
- Comprehensive test suite (409 tests)

### Technical Stack

- React Native 0.81.5 (Expo SDK 54)
- TypeScript 5.x (Strict Mode)
- NativeWind v5 (TailwindCSS)
- Supabase (Auth, Storage, Realtime)
- Drizzle ORM + expo-sqlite
- Zustand + React Query
- @siteed/expo-audio-studio for recording
- Sentry for error tracking

---

## Release Notes Format

Each release follows this structure:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes and security enhancements

---

**Note**: Versions prior to 1.0.0 were development/beta releases not documented here.
