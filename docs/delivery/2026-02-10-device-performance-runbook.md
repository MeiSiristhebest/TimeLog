# Device Performance Measurement Runbook

## Purpose
Collect real-device evidence for:
- cold start `< 2s`
- recording start latency `< 200ms`

## Inputs
- `tools/perf/device-metrics.json`
- Dev build (`npx expo start --dev-client`)

## Measurement Procedure
1. Build and install a dev client on the target device.
2. Cold-start test:
   - fully terminate the app
   - launch app from icon
   - measure time from icon tap to first interactive home screen (ms)
   - repeat 5 times per device
3. Audio start latency test:
   - tap record button
   - measure from tap to first waveform/metering update (ms)
   - repeat 10 times per device
4. Write every sample into `tools/perf/device-metrics.json`.
5. Generate report:
   - `npm run perf:device:report`

## Output
- `docs/delivery/2026-02-10-device-performance-report.md`

## Acceptance
- Average cold start `<= 2000ms`
- Average audio start latency `<= 200ms`
