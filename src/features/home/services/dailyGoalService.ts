import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { dailyGoals } from '@/db/schema';
import { mmkv } from '@/lib/mmkv';

export const DEFAULT_DAILY_GOAL_DURATION_MS = 5 * 60 * 1000;
const DAILY_GOAL_DURATION_KEY = 'dailyGoal.durationMs';
const MIN_DAILY_GOAL_DURATION_MS = 60 * 1000;
const MAX_DAILY_GOAL_DURATION_MS = 60 * 60 * 1000;

export type DailyGoalProgressInput = {
  goalDurationMs: number;
  completedDurationMs: number;
  recordingDurationMs: number;
  nowMs: number;
  completedAt: number | null;
};

export type DailyGoalProgressResult = {
  completedDurationMs: number;
  completedAt: number | null;
};

export type DailyGoalRecord = typeof dailyGoals.$inferSelect;

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function buildDailyGoalId(userId: string | null | undefined, dateKey: string): string {
  return `daily-goal_${userId ?? 'local'}_${dateKey}`;
}

export function computeDailyGoalProgress(
  input: DailyGoalProgressInput
): DailyGoalProgressResult {
  const safeRecordingDurationMs = Math.max(0, input.recordingDurationMs);
  const completedDurationMs = input.completedDurationMs + safeRecordingDurationMs;
  const completedAt =
    input.completedAt ?? (completedDurationMs >= input.goalDurationMs ? input.nowMs : null);

  return {
    completedDurationMs,
    completedAt,
  };
}

export function normalizeDailyGoalDurationMs(durationMs: number): number {
  if (!Number.isFinite(durationMs)) {
    return DEFAULT_DAILY_GOAL_DURATION_MS;
  }

  return Math.min(
    MAX_DAILY_GOAL_DURATION_MS,
    Math.max(MIN_DAILY_GOAL_DURATION_MS, Math.round(durationMs))
  );
}

export function getDefaultDailyGoalDurationMs(): number {
  const stored = mmkv.getString(DAILY_GOAL_DURATION_KEY);
  if (!stored) {
    return DEFAULT_DAILY_GOAL_DURATION_MS;
  }

  return normalizeDailyGoalDurationMs(Number(stored));
}

export function setDefaultDailyGoalDurationMs(durationMs: number): number {
  const normalized = normalizeDailyGoalDurationMs(durationMs);
  mmkv.set(DAILY_GOAL_DURATION_KEY, String(normalized));

  return normalized;
}

export async function ensureDailyGoalForDate(params: {
  userId?: string | null;
  date?: Date;
  goalDurationMs?: number;
}): Promise<DailyGoalRecord> {
  const dateKey = getLocalDateKey(params.date);
  const id = buildDailyGoalId(params.userId, dateKey);
  const existing = await db.select().from(dailyGoals).where(eq(dailyGoals.id, id)).limit(1);
  const existingGoal = existing[0];

  if (existingGoal) {
    return existingGoal;
  }

  const nowMs = Date.now();
  const goal: DailyGoalRecord = {
    id,
    userId: params.userId ?? null,
    dateKey,
    goalDurationMs: normalizeDailyGoalDurationMs(
      params.goalDurationMs ?? getDefaultDailyGoalDurationMs()
    ),
    completedDurationMs: 0,
    completedAt: null,
    createdAt: nowMs,
    updatedAt: nowMs,
  };

  await db.insert(dailyGoals).values(goal);

  return goal;
}

export async function setDailyGoalDurationForDate(params: {
  userId?: string | null;
  date?: Date;
  goalDurationMs: number;
}): Promise<DailyGoalRecord> {
  const normalized = setDefaultDailyGoalDurationMs(params.goalDurationMs);
  const goal = await ensureDailyGoalForDate({
    userId: params.userId,
    date: params.date,
    goalDurationMs: normalized,
  });
  const nowMs = Date.now();
  const completedAt =
    goal.completedDurationMs >= normalized ? goal.completedAt ?? nowMs : null;

  await db
    .update(dailyGoals)
    .set({
      goalDurationMs: normalized,
      completedAt,
      updatedAt: nowMs,
    })
    .where(eq(dailyGoals.id, goal.id));

  return {
    ...goal,
    goalDurationMs: normalized,
    completedAt,
    updatedAt: nowMs,
  };
}

export async function addRecordingToDailyGoal(params: {
  userId?: string | null;
  durationMs: number;
  recordedAt?: Date;
}): Promise<DailyGoalRecord> {
  const nowMs = Date.now();
  const goal = await ensureDailyGoalForDate({
    userId: params.userId,
    date: params.recordedAt,
  });
  const progress = computeDailyGoalProgress({
    goalDurationMs: goal.goalDurationMs,
    completedDurationMs: goal.completedDurationMs,
    recordingDurationMs: params.durationMs,
    nowMs,
    completedAt: goal.completedAt,
  });

  await db
    .update(dailyGoals)
    .set({
      completedDurationMs: progress.completedDurationMs,
      completedAt: progress.completedAt,
      updatedAt: nowMs,
    })
    .where(eq(dailyGoals.id, goal.id));

  return {
    ...goal,
    completedDurationMs: progress.completedDurationMs,
    completedAt: progress.completedAt,
    updatedAt: nowMs,
  };
}
