# Hardcode Audit Baseline (2026-02-14)

Generated at: 2026-02-14T07:47:47.293Z

## Scope

- Source roots: app, src
- Scanned files: 435

## Metrics

| Metric | Count |
| --- | ---: |
| colorLiteralsNonThemeNonTest | 219 |
| routeLiteralCalls | 40 |
| permissionRequestsOutsidePolicy | 0 |
| permissionRequestsTotal | 15 |
| roleLiteralCalls | 88 |
| envFallbackLiterals | 8 |

## Wave 1 Result (2026-02-14)

Latest run: `npm run hardcode:audit` on 2026-02-14.

| Metric | Baseline | Current | Delta |
| --- | ---: | ---: | ---: |
| scannedFiles | 435 | 441 | +6 |
| colorLiteralsNonThemeNonTest | 219 | 149 | -70 |
| routeLiteralCalls | 40 | 0 | -40 |
| permissionRequestsOutsidePolicy | 0 | 0 | 0 |
| permissionRequestsTotal | 15 | 15 | 0 |
| roleLiteralCalls | 88 | 88 | 0 |
| envFallbackLiterals | 8 | 3 | -5 |
| cjkLiteralsInUi | 0 | 0 | 0 |

Wave 1 highlights:
- Removed all route literal navigation calls in production modules (`40 -> 0`).
- Reduced non-theme color literals in production paths (`219 -> 149`).
- Removed silent env fallback URLs from weather/sync/supabase runtime paths (`8 -> 3`).
- Added CJK literal governance for UI source (`cjkLiteralsInUi=0`).

## Top Files: colorLiteralsNonThemeNonTest

- src/components/ui/heritage/HeritageTheme.tsx: 36
- src/features/settings/screens/FontSizeScreen.tsx: 25
- src/features/discovery/screens/TopicsDiscoveryScreen.tsx: 15
- src/components/ui/HeritageAlert.tsx: 10
- src/features/discovery/components/CategoryFilter.tsx: 9
- src/components/ui/feedback/ToastProvider.tsx: 7
- src/features/story-gallery/components/EmptyGallery.tsx: 6
- src/features/auth/screens/RecoveryCodeScreen.tsx: 5
- src/components/ui/HeritageDatePicker.tsx: 4
- src/components/ui/UndoToast.tsx: 4

## Top Files: routeLiteralCalls

- src/features/auth/hooks/useAuthLogic.ts: 10
- src/features/app/screens/SplashScreen.tsx: 5
- src/features/app/screens/AppEntryScreen.tsx: 4
- src/features/home/hooks/useHomeLogic.ts: 3
- src/features/settings/hooks/useSettingsLogic.ts: 3
- src/features/family/hooks/useFamilyLogic.ts: 2
- src/features/family-listener/hooks/useNotifications.ts: 2
- src/features/settings/screens/SettingsHomeScreen.tsx: 2
- src/features/story-gallery/screens/StoryDetailScreen.tsx: 2
- src/features/auth/hooks/useDeepLinkHandler.ts: 1

## Top Files: permissionRequestsOutsidePolicy

- none

## Top Files: envFallbackLiterals

- src/lib/supabase.ts: 2
- src/lib/sync-engine/transport.ts: 2
- app/api/health+api.ts: 1
- src/features/auth/services/authService.ts: 1
- src/features/family/services/inviteService.ts: 1
- src/features/home/services/weatherService.ts: 1
