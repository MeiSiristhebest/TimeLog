import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from './authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAuthStore.setState({
      status: 'idle',
      sessionUserId: undefined,
      error: undefined,
    });
  });

  describe('initial state', () => {
    it('should have idle status initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.status).toBe('idle');
    });

    it('should have undefined sessionUserId initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.sessionUserId).toBeUndefined();
    });

    it('should have undefined error initially', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('setRestoring', () => {
    it('should set status to restoring', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setRestoring();
      });

      expect(result.current.status).toBe('restoring');
    });

    it('should clear any existing error', () => {
      useAuthStore.setState({ error: 'some error' });
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setRestoring();
      });

      expect(result.current.error).toBeUndefined();
    });
  });

  describe('setAuthenticated', () => {
    it('should set status to authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuthenticated('user-123');
      });

      expect(result.current.status).toBe('authenticated');
    });

    it('should set sessionUserId when provided', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuthenticated('user-123');
      });

      expect(result.current.sessionUserId).toBe('user-123');
    });

    it('should allow undefined userId for anonymous auth', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuthenticated();
      });

      expect(result.current.status).toBe('authenticated');
      expect(result.current.sessionUserId).toBeUndefined();
    });

    it('should clear any existing error', () => {
      useAuthStore.setState({ error: 'some error' });
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setAuthenticated('user-123');
      });

      expect(result.current.error).toBeUndefined();
    });
  });

  describe('setUnauthenticated', () => {
    it('should set status to unauthenticated', () => {
      useAuthStore.setState({ status: 'authenticated', sessionUserId: 'user-123' });
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUnauthenticated();
      });

      expect(result.current.status).toBe('unauthenticated');
    });

    it('should clear sessionUserId', () => {
      useAuthStore.setState({ status: 'authenticated', sessionUserId: 'user-123' });
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUnauthenticated();
      });

      expect(result.current.sessionUserId).toBeUndefined();
    });

    it('should set error when provided', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUnauthenticated('Session expired');
      });

      expect(result.current.error).toBe('Session expired');
    });

    it('should allow undefined error', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUnauthenticated();
      });

      expect(result.current.error).toBeUndefined();
    });
  });

  describe('state transitions', () => {
    it('should handle full auth flow: idle -> restoring -> authenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.status).toBe('idle');

      act(() => {
        result.current.setRestoring();
      });
      expect(result.current.status).toBe('restoring');

      act(() => {
        result.current.setAuthenticated('user-456');
      });
      expect(result.current.status).toBe('authenticated');
      expect(result.current.sessionUserId).toBe('user-456');
    });

    it('should handle failed auth flow: idle -> restoring -> unauthenticated', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setRestoring();
      });
      expect(result.current.status).toBe('restoring');

      act(() => {
        result.current.setUnauthenticated('No stored session');
      });
      expect(result.current.status).toBe('unauthenticated');
      expect(result.current.error).toBe('No stored session');
    });

    it('should handle logout flow: authenticated -> unauthenticated', () => {
      useAuthStore.setState({
        status: 'authenticated',
        sessionUserId: 'user-789',
      });
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUnauthenticated();
      });

      expect(result.current.status).toBe('unauthenticated');
      expect(result.current.sessionUserId).toBeUndefined();
    });
  });
});
