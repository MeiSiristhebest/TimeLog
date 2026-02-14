#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const REQUIRED_ENV = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'RLS_SENIOR_EMAIL',
  'RLS_SENIOR_PASSWORD',
  'RLS_FAMILY_EMAIL',
  'RLS_FAMILY_PASSWORD',
  'RLS_INTRUDER_EMAIL',
  'RLS_INTRUDER_PASSWORD',
  'RLS_EXPECTED_SHARED_STORY_ID',
];

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function formatResultStatus(result) {
  return result.pass ? 'PASS' : 'FAIL';
}

async function signIn(label, email, password) {
  const client = createClient(
    getEnv('EXPO_PUBLIC_SUPABASE_URL'),
    getEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY')
  );

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`[${label}] sign-in failed: ${error?.message ?? 'unknown error'}`);
  }

  return { client, userId: data.session.user.id };
}

async function run() {
  for (const name of REQUIRED_ENV) {
    getEnv(name);
  }

  const sharedStoryId = getEnv('RLS_EXPECTED_SHARED_STORY_ID');
  const results = [];

  const senior = await signIn(
    'senior',
    getEnv('RLS_SENIOR_EMAIL'),
    getEnv('RLS_SENIOR_PASSWORD')
  );
  const family = await signIn(
    'family',
    getEnv('RLS_FAMILY_EMAIL'),
    getEnv('RLS_FAMILY_PASSWORD')
  );
  const intruder = await signIn(
    'intruder',
    getEnv('RLS_INTRUDER_EMAIL'),
    getEnv('RLS_INTRUDER_PASSWORD')
  );

  const seniorStoryResult = await senior.client
    .from('audio_recordings')
    .select('id, user_id')
    .eq('id', sharedStoryId)
    .eq('user_id', senior.userId);

  results.push({
    id: 'RLS-01',
    expectation: 'Senior can read own expected shared story row',
    pass: !seniorStoryResult.error && (seniorStoryResult.data?.length ?? 0) === 1,
    detail: seniorStoryResult.error?.message ?? `rows=${seniorStoryResult.data?.length ?? 0}`,
  });

  const familyStoryResult = await family.client
    .from('audio_recordings')
    .select('id, user_id')
    .eq('id', sharedStoryId)
    .eq('user_id', senior.userId);

  results.push({
    id: 'RLS-02',
    expectation: 'Linked family member can read expected shared story row',
    pass: !familyStoryResult.error && (familyStoryResult.data?.length ?? 0) === 1,
    detail: familyStoryResult.error?.message ?? `rows=${familyStoryResult.data?.length ?? 0}`,
  });

  const intruderStoryResult = await intruder.client
    .from('audio_recordings')
    .select('id, user_id')
    .eq('id', sharedStoryId)
    .eq('user_id', senior.userId);

  results.push({
    id: 'RLS-03',
    expectation: 'Unlinked user cannot read senior shared story row',
    pass: !intruderStoryResult.error && (intruderStoryResult.data?.length ?? 0) === 0,
    detail: intruderStoryResult.error?.message ?? `rows=${intruderStoryResult.data?.length ?? 0}`,
  });

  const intruderQuestionResult = await intruder.client
    .from('family_questions')
    .select('id, senior_user_id')
    .eq('senior_user_id', senior.userId)
    .limit(1);

  results.push({
    id: 'RLS-04',
    expectation: 'Unlinked user cannot read senior family questions',
    pass: !intruderQuestionResult.error && (intruderQuestionResult.data?.length ?? 0) === 0,
    detail: intruderQuestionResult.error?.message ?? `rows=${intruderQuestionResult.data?.length ?? 0}`,
  });

  const generatedAt = new Date().toISOString();
  const markdownLines = [
    '# RLS End-to-End Verification Report',
    '',
    `Generated at: ${generatedAt}`,
    '',
    '| Check ID | Expectation | Status | Detail |',
    '|---|---|---|---|',
    ...results.map(
      (result) =>
        `| ${result.id} | ${result.expectation} | ${formatResultStatus(result)} | ${result.detail} |`
    ),
    '',
    '## Test Fixture Inputs',
    '',
    `- shared_story_id: \`${sharedStoryId}\``,
    `- senior_user_id: \`${senior.userId}\``,
    `- family_user_id: \`${family.userId}\``,
    `- intruder_user_id: \`${intruder.userId}\``,
    '',
  ];

  const reportPath = resolve(process.cwd(), 'docs/delivery/2026-02-10-rls-e2e-evidence.md');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, markdownLines.join('\n'), 'utf8');

  await Promise.all([
    senior.client.auth.signOut(),
    family.client.auth.signOut(),
    intruder.client.auth.signOut(),
  ]);

  const failed = results.filter((result) => !result.pass);
  if (failed.length > 0) {
    throw new Error(`${failed.length} RLS check(s) failed. See docs/delivery/2026-02-10-rls-e2e-evidence.md`);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
