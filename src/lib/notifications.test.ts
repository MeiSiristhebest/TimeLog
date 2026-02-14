/**
 * Tests for Push Notification Service
 *
 * Story 4.4: Push Notification & Deep Link (AC: 1, 2, 3)
 */

/* eslint-disable import/first */

// Mock expo-constants BEFORE importing the module
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

// Mock devLogger
jest.mock('./devLogger', () => ({
  devLog: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock react-native
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: {
    openURL: jest.fn(),
    openSettings: jest.fn(),
  },
}));

// Mock supabase
jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      upsert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  canRequestNotificationPermission,
  registerForPushNotifications,
  unregisterPushToken,
  refreshPushToken,
  addNotificationResponseListener,
  addForegroundNotificationListener,
  getLastNotificationResponse,
  scheduleLocalNotification,
  cancelAllNotifications,
  getBadgeCount,
  setBadgeCount,
} from './notifications';
import { PERMISSION_CONTEXT } from '@/features/permissions/permissionPolicy';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

describe('notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationPermissionStatus', () => {
    it('returns granted status when permission is granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const status = await getNotificationPermissionStatus();
      expect(status).toBe('granted');
    });

    it('returns denied status when permission is denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const status = await getNotificationPermissionStatus();
      expect(status).toBe('denied');
    });

    it('returns undetermined status when permission is undetermined', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });

      const status = await getNotificationPermissionStatus();
      expect(status).toBe('undetermined');
    });
  });

  describe('requestNotificationPermission', () => {
    it('returns granted without requesting if already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const status = await requestNotificationPermission(PERMISSION_CONTEXT.NOTIFICATION_PROMPT);

      expect(status).toBe('granted');
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permission when not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const status = await requestNotificationPermission(PERMISSION_CONTEXT.NOTIFICATION_PROMPT);

      expect(status).toBe('granted');
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns denied when user denies permission', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const status = await requestNotificationPermission(PERMISSION_CONTEXT.NOTIFICATION_PROMPT);

      expect(status).toBe('denied');
    });
  });

  describe('canRequestNotificationPermission', () => {
    it('returns true when canAskAgain is true', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
        canAskAgain: true,
      });

      const canAsk = await canRequestNotificationPermission();
      expect(canAsk).toBe(true);
    });

    it('returns false when canAskAgain is false', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      const canAsk = await canRequestNotificationPermission();
      expect(canAsk).toBe(false);
    });
  });

  describe('registerForPushNotifications', () => {
    it('returns null on non-device (simulator)', async () => {
      // Override isDevice for this test
      Object.defineProperty(Device, 'isDevice', { value: false });

      const token = await registerForPushNotifications();

      expect(token).toBeNull();

      // Restore
      Object.defineProperty(Device, 'isDevice', { value: true });
    });

    it('returns null when permission not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });

      const token = await registerForPushNotifications();

      expect(token).toBeNull();
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('registers token and stores in Supabase when permission granted', async () => {
      const mockToken = 'ExponentPushToken[xxxxxx]';

      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: mockUpsert,
      });

      const token = await registerForPushNotifications();

      expect(token).toBe(mockToken);
      expect(supabase.from).toHaveBeenCalledWith('user_push_tokens');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          push_token: mockToken,
          device_type: 'ios',
        }),
        expect.any(Object)
      );
    });
  });

  describe('unregisterPushToken', () => {
    it('deletes token from Supabase', async () => {
      const mockToken = 'ExponentPushToken[xxxxxx]';

      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });

      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn(() => ({ eq: mockEq }));
      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      await unregisterPushToken();

      expect(supabase.from).toHaveBeenCalledWith('user_push_tokens');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('push_token', mockToken);
    });
  });

  describe('refreshPushToken', () => {
    it('returns null when permission not granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const token = await refreshPushToken();

      expect(token).toBeNull();
    });

    it('registers when permission granted', async () => {
      const mockToken = 'ExponentPushToken[xxxxxx]';

      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: mockToken,
      });
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const token = await refreshPushToken();

      expect(token).toBe(mockToken);
    });
  });

  describe('notification listeners', () => {
    it('addNotificationResponseListener returns cleanup function', () => {
      const mockRemove = jest.fn();
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      const callback = jest.fn();
      const cleanup = addNotificationResponseListener(callback);

      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');

      cleanup();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('addForegroundNotificationListener returns cleanup function', () => {
      const mockRemove = jest.fn();
      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      const callback = jest.fn();
      const cleanup = addForegroundNotificationListener(callback);

      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalled();
      expect(typeof cleanup).toBe('function');

      cleanup();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('getLastNotificationResponse', () => {
    it('returns notification data when response exists', async () => {
      const mockData = { storyId: 'story-123', type: 'new_story' };

      (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValue({
        notification: {
          request: {
            content: {
              data: mockData,
            },
          },
        },
      });

      const result = await getLastNotificationResponse();

      expect(result).toEqual(mockData);
    });

    it('returns null when no response exists', async () => {
      (Notifications.getLastNotificationResponseAsync as jest.Mock).mockResolvedValue(null);

      const result = await getLastNotificationResponse();

      expect(result).toBeNull();
    });
  });

  describe('local notifications', () => {
    it('scheduleLocalNotification calls scheduleNotificationAsync', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');

      const id = await scheduleLocalNotification('Test Title', 'Test Body', {
        storyId: 'story-123',
        type: 'new_story',
      });

      expect(id).toBe('notification-id');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'Test Title',
          body: 'Test Body',
          data: { storyId: 'story-123', type: 'new_story' },
          sound: 'default',
        },
        trigger: null,
      });
    });

    it('cancelAllNotifications calls cancelAllScheduledNotificationsAsync', async () => {
      await cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('badge count', () => {
    it('getBadgeCount returns badge count', async () => {
      (Notifications.getBadgeCountAsync as jest.Mock).mockResolvedValue(5);

      const count = await getBadgeCount();

      expect(count).toBe(5);
    });

    it('setBadgeCount calls setBadgeCountAsync', async () => {
      await setBadgeCount(10);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(10);
    });
  });
});
