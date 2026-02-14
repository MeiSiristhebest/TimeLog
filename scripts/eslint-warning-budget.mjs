#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BASELINE_PATH = path.resolve(process.cwd(), 'tools/eslint-warning-baseline.json');

function runEslintJson() {
  const result = spawnSync('npx eslint "**/*.{js,jsx,ts,tsx}" -f json', {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 200,
    shell: true,
  });

  if (result.error) {
    throw new Error(`ESLint execution failed: ${result.error.message}`);
  }

  if (!result.stdout && result.status && result.status !== 0) {
    throw new Error(`ESLint execution failed: ${result.stderr || 'unknown error'}`);
  }

  const stdout = (result.stdout ?? '').trim();
  if (!stdout) {
    return [];
  }

  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(
      `Failed to parse ESLint JSON output: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function normalizePath(filePath) {
  const relativePath = path.relative(process.cwd(), filePath || '').replace(/\\/g, '/');
  return relativePath || filePath || 'unknown-file';
}

function collectWarningMap(eslintJson) {
  const warningsByFileRule = {};
  let warningTotal = 0;
  let errorTotal = 0;

  for (const fileResult of eslintJson) {
    const file = normalizePath(fileResult.filePath);
    for (const message of fileResult.messages ?? []) {
      if (message.severity === 2) {
        errorTotal += 1;
      }

      if (message.severity !== 1) {
        continue;
      }

      warningTotal += 1;
      const ruleId = message.ruleId ?? 'unknown';
      const key = `${file}::${ruleId}`;
      warningsByFileRule[key] = (warningsByFileRule[key] ?? 0) + 1;
    }
  }

  return { warningsByFileRule, warningTotal, errorTotal };
}

function writeBaseline(current) {
  const payload = {
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    warningTotal: current.warningTotal,
    warningsByFileRule: current.warningsByFileRule,
  };

  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(
    `[warning-budget] Baseline written: ${BASELINE_PATH} (warnings=${current.warningTotal})`
  );
}

function checkAgainstBaseline(current) {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Baseline file missing: ${BASELINE_PATH}. Run --write first.`);
  }

  const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  const baseMap = baseline.warningsByFileRule ?? {};
  const deltas = [];

  for (const [key, currentCount] of Object.entries(current.warningsByFileRule)) {
    const baselineCount = baseMap[key] ?? 0;
    if (currentCount > baselineCount) {
      deltas.push({
        key,
        baseline: baselineCount,
        current: currentCount,
        delta: currentCount - baselineCount,
      });
    }
  }

  if (deltas.length > 0) {
    console.error('[warning-budget] New warning budget regressions detected:');
    for (const delta of deltas.sort((a, b) => b.delta - a.delta)) {
      console.error(`  - ${delta.key}: ${delta.baseline} -> ${delta.current} (+${delta.delta})`);
    }
    process.exit(1);
  }

  console.log(
    `[warning-budget] OK: no warning increases (baseline=${baseline.warningTotal ?? 'n/a'}, current=${current.warningTotal}).`
  );
}

function main() {
  const args = new Set(process.argv.slice(2));
  const writeMode = args.has('--write');
  const checkMode = args.has('--check');

  if (!writeMode && !checkMode) {
    console.error('Usage: node scripts/eslint-warning-budget.mjs --write | --check');
    process.exit(1);
  }

  const eslintJson = runEslintJson();
  const current = collectWarningMap(eslintJson);

  if (current.errorTotal > 0) {
    console.error(
      `[warning-budget] ESLint has ${current.errorTotal} errors. Fix errors before warning budget check.`
    );
    process.exit(2);
  }

  if (writeMode) {
    writeBaseline(current);
  } else {
    checkAgainstBaseline(current);
  }
}

main();
