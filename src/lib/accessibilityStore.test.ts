import { renderHook, act } from '@testing-library/react-native';
import { useAccessibilityStore } from './accessibilityStore';

// Reset mmkv mock store between tests
const mockMmkvStore = new Map<string, string>();

jest.mock('./mmkv', () => ({
  mmkv: {
    getString: jest.fn((key: string) => mockMmkvStore.get(key)),
    set: jest.fn((key: string, value: string) => mockMmkvStore.set(key, value)),
    delete: jest.fn((key: string) => mockMmkvStore.delete(key)),
  },
}));

describe('useAccessibilityStore', () => {
  beforeEach(() => {
    // Clear mock storage
    mockMmkvStore.clear();
    // Reset store to initial state
    useAccessibilityStore.setState({
      isHighContrast: false,
    });
  });

  describe('initial state', () => {
    it('should have isHighContrast set to false initially', () => {
      const { result } = renderHook(() => useAccessibilityStore());
      expect(result.current.isHighContrast).toBe(false);
    });
  });

  describe('toggleHighContrast', () => {
    it('should toggle isHighContrast from false to true', () => {
      const { result } = renderHook(() => useAccessibilityStore());

      expect(result.current.isHighContrast).toBe(false);

      act(() => {
        result.current.toggleHighContrast();
      });

      expect(result.current.isHighContrast).toBe(true);
    });

    it('should toggle isHighContrast from true to false', () => {
      useAccessibilityStore.setState({ isHighContrast: true });
      const { result } = renderHook(() => useAccessibilityStore());

      expect(result.current.isHighContrast).toBe(true);

      act(() => {
        result.current.toggleHighContrast();
      });

      expect(result.current.isHighContrast).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      const { result } = renderHook(() => useAccessibilityStore());

      expect(result.current.isHighContrast).toBe(false);

      act(() => {
        result.current.toggleHighContrast();
      });
      expect(result.current.isHighContrast).toBe(true);

      act(() => {
        result.current.toggleHighContrast();
      });
      expect(result.current.isHighContrast).toBe(false);

      act(() => {
        result.current.toggleHighContrast();
      });
      expect(result.current.isHighContrast).toBe(true);
    });
  });

  describe('setHighContrast', () => {
    it('should set isHighContrast to true', () => {
      const { result } = renderHook(() => useAccessibilityStore());

      act(() => {
        result.current.setHighContrast(true);
      });

      expect(result.current.isHighContrast).toBe(true);
    });

    it('should set isHighContrast to false', () => {
      useAccessibilityStore.setState({ isHighContrast: true });
      const { result } = renderHook(() => useAccessibilityStore());

      act(() => {
        result.current.setHighContrast(false);
      });

      expect(result.current.isHighContrast).toBe(false);
    });

    it('should not change state when setting same value', () => {
      const { result } = renderHook(() => useAccessibilityStore());

      expect(result.current.isHighContrast).toBe(false);

      act(() => {
        result.current.setHighContrast(false);
      });

      expect(result.current.isHighContrast).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should use accessibility-storage as persistence key', () => {
      // The store is configured with name: 'accessibility-storage'
      // This test verifies the store has persist middleware configured
      const store = useAccessibilityStore;
      
      // Zustand persist stores have a persist property
      expect(store.persist).toBeDefined();
      expect(store.persist.getOptions().name).toBe('accessibility-storage');
    });
  });
});
