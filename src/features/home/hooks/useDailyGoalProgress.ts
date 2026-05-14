import { useEffect, useMemo } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { dailyGoals } from '@/db/schema';
import {
  buildDailyGoalId,
  DEFAULT_DAILY_GOAL_DURATION_MS,
  ensureDailyGoalForDate,
  getLocalDateKey,
} from '@/features/home/services/dailyGoalService';
import { devLog } from '@/lib/devLogger';

export type DailyGoalProgress = {
  dateKey: string;
  goalDurationMs: number;
  completedDurationMs: number;
  isCompleted: boolean;
  progressRatio: number;
};

export function useDailyGoalProgress(userId?: string | null): DailyGoalProgress {
  const dateKey = getLocalDateKey();
  const goalId = buildDailyGoalId(userId, dateKey);

  useEffect(() => {
    void ensureDailyGoalForDate({ userId }).catch((error) => {
      devLog.warn('[useDailyGoalProgress] Failed to ensure today goal', error);
    });
  }, [userId]);

  const { data } = useLiveQuery(
    db.select().from(dailyGoals).where(eq(dailyGoals.id, goalId)).limit(1)
  );

  const goal = data?.[0];

  return useMemo(() => {
    const goalDurationMs = goal?.goalDurationMs ?? DEFAULT_DAILY_GOAL_DURATION_MS;
    const completedDurationMs = goal?.completedDurationMs ?? 0;
    const progressRatio =
      goalDurationMs > 0 ? Math.min(1, completedDurationMs / goalDurationMs) : 1;

    return {
      dateKey,
      goalDurationMs,
      completedDurationMs,
      isCompleted: completedDurationMs >= goalDurationMs,
      progressRatio,
    };
  }, [dateKey, goal]);
}
