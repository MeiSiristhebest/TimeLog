import {
  buildDailyGoalId,
  computeDailyGoalProgress,
  DEFAULT_DAILY_GOAL_DURATION_MS,
  getLocalDateKey,
  normalizeDailyGoalDurationMs,
} from './dailyGoalService';

describe('dailyGoalService', () => {
  it('formats a local date key for daily goal rows', () => {
    const date = new Date(2026, 0, 9, 23, 30);

    expect(getLocalDateKey(date)).toBe('2026-01-09');
  });

  it('builds a stable daily goal id from user and date', () => {
    expect(buildDailyGoalId('senior-1', '2026-01-09')).toBe('daily-goal_senior-1_2026-01-09');
    expect(buildDailyGoalId(null, '2026-01-09')).toBe('daily-goal_local_2026-01-09');
  });

  it('adds recording duration and marks the goal complete when target is reached', () => {
    const result = computeDailyGoalProgress({
      goalDurationMs: DEFAULT_DAILY_GOAL_DURATION_MS,
      completedDurationMs: DEFAULT_DAILY_GOAL_DURATION_MS - 30_000,
      recordingDurationMs: 45_000,
      nowMs: 1_770_000_000_000,
      completedAt: null,
    });

    expect(result.completedDurationMs).toBe(DEFAULT_DAILY_GOAL_DURATION_MS + 15_000);
    expect(result.completedAt).toBe(1_770_000_000_000);
  });

  it('keeps an existing completion timestamp and ignores negative durations', () => {
    const result = computeDailyGoalProgress({
      goalDurationMs: 60_000,
      completedDurationMs: 75_000,
      recordingDurationMs: -5_000,
      nowMs: 1_770_000_000_000,
      completedAt: 1_760_000_000_000,
    });

    expect(result.completedDurationMs).toBe(75_000);
    expect(result.completedAt).toBe(1_760_000_000_000);
  });

  it('keeps configurable goal duration within supported bounds', () => {
    expect(normalizeDailyGoalDurationMs(30_000)).toBe(60_000);
    expect(normalizeDailyGoalDurationMs(90 * 60_000)).toBe(60 * 60_000);
    expect(normalizeDailyGoalDurationMs(10 * 60_000)).toBe(10 * 60_000);
  });
});
