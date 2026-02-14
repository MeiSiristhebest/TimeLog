/* eslint-disable import/first */

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

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

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: {
    openURL: jest.fn(),
    openSettings: jest.fn(),
  },
}));

jest.mock('@/lib/devLogger', () => ({
  devLog: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/supabase', () => ({
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

import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  requestNotificationPermission,
} from '@/lib/notifications';
import { PERMISSION_CONTEXT } from '@/features/permissions/permissionPolicy';

describe('Permission request boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows notification prompt context to request notification permission', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });

    const status = await requestNotificationPermission(PERMISSION_CONTEXT.NOTIFICATION_PROMPT);

    expect(status).toBe('granted');
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('blocks notification permission requests from disallowed contexts', async () => {
    await expect(
      requestNotificationPermission(PERMISSION_CONTEXT.RECORDER_START)
    ).rejects.toThrow('[Permissions] notifications request is not allowed');

    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('does not trigger system notification permission request during token registration', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'undetermined',
    });

    const token = await registerForPushNotifications();

    expect(token).toBeNull();
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
