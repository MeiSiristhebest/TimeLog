#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const INPUT_PATH = resolve(process.cwd(), 'tools/perf/device-metrics.json');
const OUTPUT_PATH = resolve(process.cwd(), 'docs/delivery/2026-02-10-device-performance-report.md');

const TARGETS = {
  coldStartMs: 2000,
  audioStartLatencyMs: 200,
};

function toNumber(value, fallback = Number.NaN) {
  return typeof value === 'number' ? value : fallback;
}

function formatStatus(actual, threshold) {
  if (Number.isNaN(actual)) return 'N/A';
  return actual <= threshold ? 'PASS' : 'FAIL';
}

function average(values) {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function main() {
  const raw = readFileSync(INPUT_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  const samples = Array.isArray(parsed.samples) ? parsed.samples : [];
  if (samples.length === 0) {
    throw new Error('No samples found in tools/perf/device-metrics.json');
  }

  const coldStartValues = samples
    .map((sample) => toNumber(sample.coldStartMs))
    .filter((value) => !Number.isNaN(value));
  const audioLatencyValues = samples
    .map((sample) => toNumber(sample.audioStartLatencyMs))
    .filter((value) => !Number.isNaN(value));

  const avgColdStart = average(coldStartValues);
  const avgAudioLatency = average(audioLatencyValues);
  const generatedAt = new Date().toISOString();

  const lines = [
    '# Device Performance Report',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '| Metric | Target | Average | Status |',
    '|---|---:|---:|---|',
    `| Cold start | ${TARGETS.coldStartMs} ms | ${Number.isNaN(avgColdStart) ? 'N/A' : `${Math.round(avgColdStart)} ms`} | ${formatStatus(avgColdStart, TARGETS.coldStartMs)} |`,
    `| Audio start latency | ${TARGETS.audioStartLatencyMs} ms | ${Number.isNaN(avgAudioLatency) ? 'N/A' : `${Math.round(avgAudioLatency)} ms`} | ${formatStatus(avgAudioLatency, TARGETS.audioStartLatencyMs)} |`,
    '',
    '## Raw Samples',
    '',
    '| Device | Platform | Cold Start (ms) | Audio Start Latency (ms) | Notes |',
    '|---|---|---:|---:|---|',
    ...samples.map((sample) => {
      const coldStart = toNumber(sample.coldStartMs);
      const audioLatency = toNumber(sample.audioStartLatencyMs);
      return `| ${sample.device ?? 'unknown'} | ${sample.platform ?? 'unknown'} | ${Number.isNaN(coldStart) ? 'N/A' : coldStart} | ${Number.isNaN(audioLatency) ? 'N/A' : audioLatency} | ${sample.notes ?? ''} |`;
    }),
    '',
  ];

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');

  const hasFail =
    (!Number.isNaN(avgColdStart) && avgColdStart > TARGETS.coldStartMs) ||
    (!Number.isNaN(avgAudioLatency) && avgAudioLatency > TARGETS.audioStartLatencyMs);

  if (hasFail) {
    process.exit(2);
  }
}

main();
