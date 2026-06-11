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

// Mock Drizzle db
jest.mock('@/db/client', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([])),
      })),
    })),
  },
}));

// Mock notificationSettingsService
const mockGetNotificationSettings = jest.fn();
jest.mock('@/lib/notifications/notificationSettingsService', () => ({
  getNotificationSettings: (...args: any[]) => mockGetNotificationSettings(...args),
  getDeviceTimeZone: () => 'Asia/Bangkok',
}));

describe('nudgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNotificationSettings.mockReset();
    mockGetNotificationSettings.mockResolvedValue(null);
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

  describe('intelligent scheduling', () => {
    it('should adjust nudge hour when it conflicts with quiet hours', async () => {
      // Quiet hours: 09:00 to 18:00. Default 10:00 AM falls inside quiet hours.
      mockGetNotificationSettings.mockResolvedValueOnce({
        userId: 'user-123',
        notificationsEnabled: true,
        gentleRemindersEnabled: true,
        quietHoursStart: '09:00',
        quietHoursEnd: '18:00',
      });

      // No history, default optimalHour is 10:00. It conflicts with 09:00-18:00.
      // Search: 10 -> 11 -> ... -> 18 (outside). So it should schedule at 18:00.
      await scheduleNudgeNotification('user-123');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            hour: 18,
          }),
        })
      );
    });

    it('should schedule nudge at user habit hour when it does not conflict with quiet hours', async () => {
      // Quiet hours: 21:00 to 09:00.
      mockGetNotificationSettings.mockResolvedValueOnce({
        userId: 'user-123',
        notificationsEnabled: true,
        gentleRemindersEnabled: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '09:00',
      });

      // Mock recordings history: mostly around 19:00 (7 PM)
      // 19:00 is outside 21:00-09:00 quiet hours.
      const mockRecordings = [
        { startedAt: new Date('2026-06-07T19:15:00').getTime() },
        { startedAt: new Date('2026-06-06T19:30:00').getTime() },
        { startedAt: new Date('2026-06-05T10:00:00').getTime() }, // one morning recording
      ];

      const { db } = require('@/db/client');
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValueOnce({
          where: jest.fn().mockResolvedValueOnce(mockRecordings),
        }),
      });

      await scheduleNudgeNotification('user-123');

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            hour: 19,
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
