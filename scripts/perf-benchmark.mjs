#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { dirname, resolve } from 'node:path';

const BENCHMARKS = [
  {
    id: 'typecheck',
    targetMs: 60000,
    command: 'npx tsc --noEmit',
  },
  {
    id: 'lint_baseline_check',
    targetMs: 20000,
    command: 'npm run lint:baseline:check',
  },
  {
    id: 'offline_policy_suite',
    targetMs: 15000,
    command: 'npx jest src/features/recorder/services/NetworkQualityService.test.ts --runInBand',
  },
  {
    id: 'family_question_linkage_suite',
    targetMs: 15000,
    command: 'npx jest tests/integration/family-question-answered-linkage.test.tsx --runInBand',
  },
];

function runBenchmark(command) {
  const startedAt = performance.now();
  const result = spawnSync(command, {
    shell: true,
    encoding: 'utf8',
    windowsHide: true,
  });
  const durationMs = Math.round(performance.now() - startedAt);

  return {
    command,
    durationMs,
    exitCode: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function formatMs(value) {
  return `${value} ms`;
}

function toMarkdown(results) {
  const now = new Date();
  const generatedAt = now.toISOString();
  const lines = [
    '# Performance Benchmark Report',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '| Benchmark | Command | Target | Duration | Status |',
    '|---|---|---:|---:|---|',
  ];

  results.forEach((result) => {
    const status =
      result.exitCode === 0
        ? result.durationMs <= result.targetMs
          ? 'PASS'
          : 'SLOW'
        : 'FAIL';
    lines.push(
      `| ${result.id} | \`${result.command}\` | ${formatMs(result.targetMs)} | ${formatMs(result.durationMs)} | ${status} |`
    );
  });

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- These benchmarks measure repeatable repository checks and critical test latencies.');
  lines.push('- Mobile runtime targets (cold start, on-device cue latency) still require device-level instrumentation runs.');
  lines.push('');

  return lines.join('\n');
}

function main() {
  const results = BENCHMARKS.map((benchmark) => {
    const run = runBenchmark(benchmark.command);
    return {
      id: benchmark.id,
      targetMs: benchmark.targetMs,
      ...run,
    };
  });

  const markdown = toMarkdown(results);
  const reportPath = resolve(process.cwd(), 'docs/delivery/2026-02-10-performance-benchmark.md');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, markdown, 'utf8');

  const failed = results.filter((result) => result.exitCode !== 0);
  const slow = results.filter((result) => result.exitCode === 0 && result.durationMs > result.targetMs);

  if (failed.length > 0) {
    console.error(markdown);
    process.exit(1);
  }

  if (slow.length > 0) {
    console.warn(markdown);
    process.exit(2);
  }

  console.log(markdown);
}

main();
