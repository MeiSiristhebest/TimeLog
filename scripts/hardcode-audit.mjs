#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const BASELINE_JSON_PATH = path.resolve(ROOT_DIR, 'tools/hardcode-audit-baseline.json');
const BASELINE_MARKDOWN_PATH = path.resolve(
  ROOT_DIR,
  'docs/delivery/hardcode-baseline-2026-02-14.md'
);

const SOURCE_ROOTS = ['app', 'src'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.expo',
  '.next',
  'coverage',
  'dist',
  'build',
  'android',
  'ios',
]);

const COLOR_LITERAL_REGEX = /#[0-9A-Fa-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const ROUTE_LITERAL_REGEX = /router\.(?:push|replace)\(\s*['"`]\//g;
const ROLE_LITERAL_REGEX = /['"`](storyteller|family|listener)['"`]/g;
const ENV_FALLBACK_REGEX = /process\.env\.[A-Z0-9_]+\s*(?:\|\||\?\?)\s*['"`]/g;
const CJK_LITERAL_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/g;
const PERMISSION_CALL_REGEX =
  /(?:requestPermissionsAsync|getPermissionsAsync|requestMediaLibraryPermissionsAsync|requestRecordingPermissionsAsync|getRecordingPermissionsAsync|getExpoPushTokenAsync)/g;

const PERMISSION_ALLOWED_FILES = new Set(
  [
    'src/lib/notifications.ts',
    'src/utils/permissions.ts',
    'src/features/recorder/services/recorderService.ts',
    'src/features/settings/screens/EditProfileScreen.tsx',
  ].map(normalizePath)
);

const MONITORED_KEYS = [
  'colorLiteralsNonThemeNonTest',
  'routeLiteralCalls',
  'permissionRequestsOutsidePolicy',
  'envFallbackLiterals',
  'cjkLiteralsInUi',
];

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function isTestFile(relativePath) {
  return (
    relativePath.includes('/__tests__/') ||
    relativePath.endsWith('.test.ts') ||
    relativePath.endsWith('.test.tsx') ||
    relativePath.endsWith('.test.js') ||
    relativePath.endsWith('.test.jsx') ||
    relativePath.startsWith('tests/')
  );
}

function isThemeOrConstantsFile(relativePath) {
  return relativePath.startsWith('src/theme/') || relativePath.startsWith('src/constants/');
}

function isDeclarationFile(relativePath) {
  return relativePath.endsWith('.d.ts');
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.storybook') {
      continue;
    }

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }
      files.push(...walkFiles(path.join(dirPath, entry.name)));
      continue;
    }

    const extension = path.extname(entry.name);
    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }
    files.push(path.join(dirPath, entry.name));
  }

  return files;
}

function countMatches(regex, text) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function incrementMap(map, key, count) {
  if (count <= 0) {
    return;
  }
  map[key] = (map[key] ?? 0) + count;
}

function topEntries(map, limit = 15) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([file, count]) => ({ file, count }));
}

function collectMetrics() {
  const files = SOURCE_ROOTS.flatMap((root) => walkFiles(path.resolve(ROOT_DIR, root)));
  const uniqueFiles = Array.from(new Set(files));

  const countersByFile = {
    colorLiteralsNonThemeNonTest: {},
    routeLiteralCalls: {},
    permissionRequestsOutsidePolicy: {},
    roleLiteralCalls: {},
    envFallbackLiterals: {},
    cjkLiteralsInUi: {},
  };

  const totals = {
    scannedFiles: uniqueFiles.length,
    colorLiteralsNonThemeNonTest: 0,
    routeLiteralCalls: 0,
    permissionRequestsOutsidePolicy: 0,
    permissionRequestsTotal: 0,
    roleLiteralCalls: 0,
    envFallbackLiterals: 0,
    cjkLiteralsInUi: 0,
  };

  for (const absFile of uniqueFiles) {
    const relativePath = normalizePath(path.relative(ROOT_DIR, absFile));
    if (isDeclarationFile(relativePath)) {
      continue;
    }

    const text = fs.readFileSync(absFile, 'utf8');
    const testFile = isTestFile(relativePath);

    if (!testFile && !isThemeOrConstantsFile(relativePath)) {
      const colorCount = countMatches(COLOR_LITERAL_REGEX, text);
      totals.colorLiteralsNonThemeNonTest += colorCount;
      incrementMap(countersByFile.colorLiteralsNonThemeNonTest, relativePath, colorCount);
    }

    if (!testFile) {
      const routeCount = countMatches(ROUTE_LITERAL_REGEX, text);
      totals.routeLiteralCalls += routeCount;
      incrementMap(countersByFile.routeLiteralCalls, relativePath, routeCount);
    }

    if (!testFile) {
      const permissionCount = countMatches(PERMISSION_CALL_REGEX, text);
      totals.permissionRequestsTotal += permissionCount;
      if (permissionCount > 0 && !PERMISSION_ALLOWED_FILES.has(relativePath)) {
        totals.permissionRequestsOutsidePolicy += permissionCount;
        incrementMap(countersByFile.permissionRequestsOutsidePolicy, relativePath, permissionCount);
      }
    }

    if (!testFile) {
      const roleCount = countMatches(ROLE_LITERAL_REGEX, text);
      totals.roleLiteralCalls += roleCount;
      incrementMap(countersByFile.roleLiteralCalls, relativePath, roleCount);
    }

    if (!testFile) {
      const envFallbackCount = countMatches(ENV_FALLBACK_REGEX, text);
      totals.envFallbackLiterals += envFallbackCount;
      incrementMap(countersByFile.envFallbackLiterals, relativePath, envFallbackCount);
    }

    if (!testFile) {
      const cjkLiteralCount = countMatches(CJK_LITERAL_REGEX, text);
      totals.cjkLiteralsInUi += cjkLiteralCount;
      incrementMap(countersByFile.cjkLiteralsInUi, relativePath, cjkLiteralCount);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    scope: SOURCE_ROOTS,
    totals,
    topFiles: {
      colorLiteralsNonThemeNonTest: topEntries(countersByFile.colorLiteralsNonThemeNonTest),
      routeLiteralCalls: topEntries(countersByFile.routeLiteralCalls),
      permissionRequestsOutsidePolicy: topEntries(countersByFile.permissionRequestsOutsidePolicy),
      roleLiteralCalls: topEntries(countersByFile.roleLiteralCalls),
      envFallbackLiterals: topEntries(countersByFile.envFallbackLiterals),
      cjkLiteralsInUi: topEntries(countersByFile.cjkLiteralsInUi),
    },
  };
}

function writeBaselineJson(result) {
  fs.mkdirSync(path.dirname(BASELINE_JSON_PATH), { recursive: true });
  fs.writeFileSync(`${BASELINE_JSON_PATH}`, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

function formatTopFiles(entries) {
  if (!entries || entries.length === 0) {
    return '- none';
  }
  return entries.slice(0, 10).map((entry) => `- ${entry.file}: ${entry.count}`).join('\n');
}

function writeBaselineMarkdown(result) {
  const lines = [
    '# Hardcode Audit Baseline (2026-02-14)',
    '',
    `Generated at: ${result.generatedAt}`,
    '',
    '## Scope',
    '',
    `- Source roots: ${result.scope.join(', ')}`,
    `- Scanned files: ${result.totals.scannedFiles}`,
    '',
    '## Metrics',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    `| colorLiteralsNonThemeNonTest | ${result.totals.colorLiteralsNonThemeNonTest} |`,
    `| routeLiteralCalls | ${result.totals.routeLiteralCalls} |`,
    `| permissionRequestsOutsidePolicy | ${result.totals.permissionRequestsOutsidePolicy} |`,
    `| permissionRequestsTotal | ${result.totals.permissionRequestsTotal} |`,
    `| roleLiteralCalls | ${result.totals.roleLiteralCalls} |`,
    `| envFallbackLiterals | ${result.totals.envFallbackLiterals} |`,
    `| cjkLiteralsInUi | ${result.totals.cjkLiteralsInUi} |`,
    '',
    '## Top Files: colorLiteralsNonThemeNonTest',
    '',
    formatTopFiles(result.topFiles.colorLiteralsNonThemeNonTest),
    '',
    '## Top Files: routeLiteralCalls',
    '',
    formatTopFiles(result.topFiles.routeLiteralCalls),
    '',
    '## Top Files: permissionRequestsOutsidePolicy',
    '',
    formatTopFiles(result.topFiles.permissionRequestsOutsidePolicy),
    '',
    '## Top Files: envFallbackLiterals',
    '',
    formatTopFiles(result.topFiles.envFallbackLiterals),
    '',
    '## Top Files: cjkLiteralsInUi',
    '',
    formatTopFiles(result.topFiles.cjkLiteralsInUi),
    '',
  ];

  fs.mkdirSync(path.dirname(BASELINE_MARKDOWN_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_MARKDOWN_PATH, lines.join('\n'), 'utf8');
}

function compareAgainstBaseline(current) {
  if (!fs.existsSync(BASELINE_JSON_PATH)) {
    throw new Error(`Baseline file missing: ${BASELINE_JSON_PATH}. Run --baseline first.`);
  }

  const baselineRaw = fs.readFileSync(BASELINE_JSON_PATH, 'utf8');
  const baseline = JSON.parse(baselineRaw);
  const regressions = [];

  for (const key of MONITORED_KEYS) {
    const baselineValue = baseline?.totals?.[key] ?? 0;
    const currentValue = current?.totals?.[key] ?? 0;
    if (currentValue > baselineValue) {
      regressions.push({
        key,
        baseline: baselineValue,
        current: currentValue,
        delta: currentValue - baselineValue,
      });
    }
  }

  return regressions;
}

function printSummary(result) {
  console.log('[hardcode-audit] Summary');
  console.log(`  scannedFiles=${result.totals.scannedFiles}`);
  console.log(`  colorLiteralsNonThemeNonTest=${result.totals.colorLiteralsNonThemeNonTest}`);
  console.log(`  routeLiteralCalls=${result.totals.routeLiteralCalls}`);
  console.log(`  permissionRequestsOutsidePolicy=${result.totals.permissionRequestsOutsidePolicy}`);
  console.log(`  permissionRequestsTotal=${result.totals.permissionRequestsTotal}`);
  console.log(`  roleLiteralCalls=${result.totals.roleLiteralCalls}`);
  console.log(`  envFallbackLiterals=${result.totals.envFallbackLiterals}`);
  console.log(`  cjkLiteralsInUi=${result.totals.cjkLiteralsInUi}`);
}

function getMode(args) {
  const modeArg = args.find((arg) => arg.startsWith('--mode='));
  if (!modeArg) {
    return 'warn';
  }
  const mode = modeArg.replace('--mode=', '').trim();
  if (mode !== 'warn' && mode !== 'error') {
    throw new Error(`Invalid mode "${mode}". Use --mode=warn or --mode=error.`);
  }
  return mode;
}

function main() {
  const args = process.argv.slice(2);
  const argSet = new Set(args);
  const mode = getMode(args);
  const baselineMode = argSet.has('--baseline');
  const checkMode = argSet.has('--check');

  const result = collectMetrics();
  printSummary(result);

  if (baselineMode) {
    writeBaselineJson(result);
    writeBaselineMarkdown(result);
    console.log(`[hardcode-audit] Baseline JSON written: ${BASELINE_JSON_PATH}`);
    console.log(`[hardcode-audit] Baseline Markdown written: ${BASELINE_MARKDOWN_PATH}`);
    return;
  }

  if (!checkMode) {
    return;
  }

  const regressions = compareAgainstBaseline(result);
  if (regressions.length === 0) {
    console.log('[hardcode-audit] OK: no regressions for monitored metrics.');
    return;
  }

  console.log('[hardcode-audit] Regressions detected:');
  for (const item of regressions) {
    console.log(`  - ${item.key}: ${item.baseline} -> ${item.current} (+${item.delta})`);
  }

  if (mode === 'error') {
    process.exit(1);
  }
}

main();
