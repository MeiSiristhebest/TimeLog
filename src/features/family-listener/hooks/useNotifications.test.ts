import { renderHook, act } from '@testing-library/react-native';
import { useNotifications } from './useNotifications';
import type { NotificationData } from '@/lib/notifications';
import { PERMISSION_CONTEXT } from '@/features/permissions/permissionPolicy';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock notifications lib
const mockGetNotificationPermissionStatus = jest.fn();
const mockRequestNotificationPermission = jest.fn();
const mockRegisterForPushNotifications = jest.fn();
const mockAddNotificationResponseListener = jest.fn();
const mockAddForegroundNotificationListener = jest.fn();
const mockGetLastNotificationResponse = jest.fn();
const mockCanRequestNotificationPermission = jest.fn();
const mockOpenNotificationSettings = jest.fn();

jest.mock('@/lib/notifications', () => ({
  getNotificationPermissionStatus: () => mockGetNotificationPermissionStatus(),
  requestNotificationPermission: (...args: unknown[]) => mockRequestNotificationPermission(...args),
  registerForPushNotifications: () => mockRegisterForPushNotifications(),
  addNotificationResponseListener: (cb: (data: NotificationData) => void) =>
    mockAddNotificationResponseListener(cb),
  addForegroundNotificationListener: (cb: (notification: unknown) => void) =>
    mockAddForegroundNotificationListener(cb),
  getLastNotificationResponse: () => mockGetLastNotificationResponse(),
  canRequestNotificationPermission: () => mockCanRequestNotificationPermission(),
  openNotificationSettings: () => mockOpenNotificationSettings(),
}));

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Default mock implementations
    mockGetNotificationPermissionStatus.mockResolvedValue('undetermined');
    mockCanRequestNotificationPermission.mockResolvedValue(true);
    mockRequestNotificationPermission.mockResolvedValue('granted');
    mockRegisterForPushNotifications.mockResolvedValue(undefined);
    mockGetLastNotificationResponse.mockResolvedValue(null);
    mockAddNotificationResponseListener.mockReturnValue(jest.fn());
    mockAddForegroundNotificationListener.mockReturnValue(jest.fn());
    mockOpenNotificationSettings.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should return initial permission status as undetermined', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.permissionStatus).toBe('undetermined');
    });

    it('should return canRequestPermission as true initially', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.canRequestPermission).toBe(true);
    });

    it('should return hasPermission as false initially', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.hasPermission).toBe(false);
    });

    it('should return foregroundNotification as null initially', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.foregroundNotification).toBeNull();
    });

    it('should return isRequesting as false initially', () => {
      const { result } = renderHook(() => useNotifications());
      expect(result.current.isRequesting).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should check permission status on mount', async () => {
      renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve(); // Flush promises
      });

      expect(mockGetNotificationPermissionStatus).toHaveBeenCalled();
    });

    it('should check if can request permission on mount', async () => {
      renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCanRequestNotificationPermission).toHaveBeenCalled();
    });

    it('should not auto-register push token when permission is already granted', async () => {
      mockGetNotificationPermissionStatus.mockResolvedValue('granted');

      renderHook(() => useNotifications());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve(); // Extra flush for nested async
      });

      expect(mockRegisterForPushNotifications).not.toHaveBeenCalled();
    });
  });

  describe('requestPermission', () => {
    it('should return true when permission is granted', async () => {
      mockRequestNotificationPermission.mockResolvedValue('granted');

      const { result } = renderHook(() => useNotifications());

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(true);
      expect(mockRequestNotificationPermission).toHaveBeenCalledWith(
        PERMISSION_CONTEXT.NOTIFICATION_PROMPT
      );
    });

    it('should return false when permission is denied', async () => {
      mockRequestNotificationPermission.mockResolvedValue('denied');

      const { result } = renderHook(() => useNotifications());

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(false);
    });

    it('should register for push notifications after granting', async () => {
      mockRequestNotificationPermission.mockResolvedValue('granted');

      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(mockRegisterForPushNotifications).toHaveBeenCalled();
    });
  });

  describe('openSettings', () => {
    it('should call openNotificationSettings', async () => {
      const { result } = renderHook(() => useNotifications());

      await act(async () => {
        await result.current.openSettings();
      });

      expect(mockOpenNotificationSettings).toHaveBeenCalled();
    });
  });

  describe('navigateToNotification', () => {
    it('should navigate to story-comments for new_comment type', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.navigateToNotification({
          storyId: 'story-123',
          type: 'new_comment',
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/story-comments/story-123');
    });

    it('should navigate to family-story for other types', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.navigateToNotification({
          storyId: 'story-456',
          type: 'new_story',
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/family-story/story-456');
    });

    it('should not navigate when storyId is missing', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.navigateToNotification({} as NotificationData);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('dismissForegroundNotification', () => {
    it('should set foregroundNotification to null', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.dismissForegroundNotification();
      });

      expect(result.current.foregroundNotification).toBeNull();
    });
  });

  describe('notification listeners', () => {
    it('should set up notification response listener on mount', () => {
      renderHook(() => useNotifications());
      expect(mockAddNotificationResponseListener).toHaveBeenCalled();
    });

    it('should set up foreground notification listener on mount', () => {
      renderHook(() => useNotifications());
      expect(mockAddForegroundNotificationListener).toHaveBeenCalled();
    });

    it('should clean up listeners on unmount', () => {
      const mockResponseCleanup = jest.fn();
      const mockForegroundCleanup = jest.fn();
      mockAddNotificationResponseListener.mockReturnValue(mockResponseCleanup);
      mockAddForegroundNotificationListener.mockReturnValue(mockForegroundCleanup);

      const { unmount } = renderHook(() => useNotifications());

      unmount();

      expect(mockResponseCleanup).toHaveBeenCalled();
      expect(mockForegroundCleanup).toHaveBeenCalled();
    });

    it('should navigate when notification response listener is triggered', () => {
      let capturedCallback: ((data: NotificationData) => void) | undefined;
      mockAddNotificationResponseListener.mockImplementation((cb) => {
        capturedCallback = cb;
        return jest.fn();
      });

      renderHook(() => useNotifications());

      expect(capturedCallback).toBeDefined();

      act(() => {
        capturedCallback?.({ storyId: 'story-from-tap', type: 'new_story' });
      });

      expect(mockPush).toHaveBeenCalledWith('/family-story/story-from-tap');
    });
  });

  describe('foreground notification handling', () => {
    it('should set foreground notification when received', () => {
      let capturedCallback: ((notification: unknown) => void) | undefined;
      mockAddForegroundNotificationListener.mockImplementation((cb) => {
        capturedCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useNotifications());

      expect(capturedCallback).toBeDefined();

      act(() => {
        capturedCallback?.({
          request: {
            identifier: 'notif-1',
            content: {
              title: 'Test Notification',
              body: 'Test body',
              data: { storyId: 'story-1', type: 'new_story' },
            },
          },
        });
      });

      expect(result.current.foregroundNotification).toEqual({
        id: 'notif-1',
        title: 'Test Notification',
        body: 'Test body',
        data: { storyId: 'story-1', type: 'new_story' },
      });
    });

    it('should auto-dismiss foreground notification after 5 seconds', () => {
      let capturedCallback: ((notification: unknown) => void) | undefined;
      mockAddForegroundNotificationListener.mockImplementation((cb) => {
        capturedCallback = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useNotifications());

      act(() => {
        capturedCallback?.({
          request: {
            identifier: 'notif-auto-dismiss',
            content: {
              title: 'Test',
              body: 'Body',
              data: { storyId: 'story-1' },
            },
          },
        });
      });

      expect(result.current.foregroundNotification).not.toBeNull();

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.foregroundNotification).toBeNull();
    });
  });
});
