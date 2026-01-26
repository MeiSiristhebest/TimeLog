/**
 * NudgeService Unit Tests
 * Story 5.3: Gentle Nudge
 */

import * as Notifications from 'expo-notifications';
import {
  scheduleNudgeNotification,
  cancelNudgeNotifications,
  shouldScheduleNudge,
  NUDGE_NOTIFICATION_TYPE,
} from './nudgeService';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id-123'),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    CALENDAR: 'calendar',
  },
}));

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { last_used_at: new Date().toISOString() },
            error: null,
          }),
        }),
      }),
    }),
  },
}));

// Mock devLogger
jest.mock('@/lib/devLogger', () => ({
  devLog: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('nudgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleNudgeNotification', () => {
    it('should schedule a notification and return the ID', async () => {
      const result = await scheduleNudgeNotification();

      expect(result).toBe('notification-id-123');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            data: expect.objectContaining({
              type: NUDGE_NOTIFICATION_TYPE,
              screen: 'topics',
            }),
          }),
        })
      );
    });

    it('should include appropriate message content', async () => {
      await scheduleNudgeNotification();

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: expect.any(String),
            body: expect.any(String),
          }),
        })
      );
    });
  });

  describe('cancelNudgeNotifications', () => {
    it('should cancel nudge-type notifications', async () => {
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([
        {
          identifier: 'nudge-1',
          content: { data: { type: NUDGE_NOTIFICATION_TYPE } },
        },
        {
          identifier: 'other-1',
          content: { data: { type: 'other' } },
        },
      ]);

      await cancelNudgeNotifications();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('nudge-1');
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('other-1');
    });

    it('should not throw on empty scheduled notifications', async () => {
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([]);

      await expect(cancelNudgeNotifications()).resolves.not.toThrow();
    });
  });

  describe('shouldScheduleNudge', () => {
    it('should return false when user was recently active', async () => {
      // Mock returns now (just active)
      const result = await shouldScheduleNudge('user-123');

      expect(result).toBe(false);
    });
  });
});
