import { renderHook, act, waitFor } from '@testing-library/react-native';
import { mmkv } from '@/lib/mmkv';
import { useHeritageThemeLogic } from './useHeritageThemeLogic';

const mockStore = new Map<string, string>();

jest.mock('@/lib/mmkv', () => ({
  mmkv: {
    getString: jest.fn((key: string) => mockStore.get(key)),
    set: jest.fn((key: string, value: string) => mockStore.set(key, value)),
    delete: jest.fn((key: string) => mockStore.delete(key)),
  },
}));

describe('useHeritageThemeLogic', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('loads theme preference from mmkv', async () => {
    mockStore.set('@heritage_theme_preference', 'dark');
    const { result } = renderHook(() => useHeritageThemeLogic());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    expect(result.current.mode).toBe('dark');
    expect(mmkv.getString).toHaveBeenCalledWith('@heritage_theme_preference');
  });

  it('persists theme preference to mmkv', async () => {
    const { result } = renderHook(() => useHeritageThemeLogic());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.setMode('light');
    });

    expect(mmkv.set).toHaveBeenCalledWith('@heritage_theme_preference', 'light');
  });
});
