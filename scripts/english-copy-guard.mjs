#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
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

const CJK_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

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

    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    files.push(path.join(dirPath, entry.name));
  }

  return files;
}

function main() {
  const files = SOURCE_ROOTS.flatMap((root) => walkFiles(path.resolve(ROOT_DIR, root)));
  const violations = [];

  for (const absFile of files) {
    const relativePath = normalizePath(path.relative(ROOT_DIR, absFile));
    if (isTestFile(relativePath) || relativePath.endsWith('.d.ts')) {
      continue;
    }

    const content = fs.readFileSync(absFile, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (CJK_REGEX.test(line)) {
        violations.push({
          file: relativePath,
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }

  if (violations.length === 0) {
    console.log('[english-copy-guard] OK: no CJK literals found in app/src production files.');
    return;
  }

  console.log('[english-copy-guard] CJK literals detected:');
  for (const violation of violations) {
    console.log(`  - ${violation.file}:${violation.line}: ${violation.text}`);
  }

  process.exit(1);
}

main();
