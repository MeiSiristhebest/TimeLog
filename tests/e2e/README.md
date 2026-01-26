# TimeLog E2E Tests - Maestro

This directory contains end-to-end tests using [Maestro](https://maestro.mobile.dev/).

## Prerequisites

1. Install Maestro CLI:

   ```bash
   # macOS
   brew install maestro

   # Linux/WSL
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

2. Build the development app:
   ```bash
   npx expo prebuild
   npx expo run:android  # or run:ios
   ```

## Running Tests

```bash
# Run all E2E tests
maestro test tests/e2e/

# Run a specific test
maestro test tests/e2e/recording-flow.yaml

# Run with debug output
maestro test --debug tests/e2e/recording-flow.yaml
```

## Test Structure

- `recording-flow.yaml` - Core recording functionality
- `playback-flow.yaml` - Story playback and gallery navigation
- `settings-flow.yaml` - Settings and profile screens

## CI Integration

See `.github/workflows/e2e.yml` for CI pipeline configuration.
