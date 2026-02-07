import {
  getDisplaySettings,
  resetDisplaySettings,
  setFontScaleIndex,
  setThemeMode,
} from './displaySettingsService';
import { mmkv } from '@/lib/mmkv';

const mockStore = new Map<string, string>();

jest.mock('@/lib/mmkv', () => ({
  mmkv: {
    getString: jest.fn((key: string) => mockStore.get(key)),
    set: jest.fn((key: string, value: string) => mockStore.set(key, value)),
    delete: jest.fn((key: string) => mockStore.delete(key)),
  },
}));

describe('displaySettingsService', () => {
  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it('defaults to system + standard when empty', () => {
    const settings = getDisplaySettings();
    expect(settings).toEqual({ themeMode: 'system', fontScaleIndex: 1 });
  });

  it('persists theme mode', () => {
    setThemeMode('dark');
    expect(mmkv.set).toHaveBeenCalledWith('display.themeMode', 'dark');
  });

  it('persists font scale index', () => {
    setFontScaleIndex(4);
    expect(mmkv.set).toHaveBeenCalledWith('display.fontScaleIndex', '4');
  });

  it('reset restores defaults', () => {
    resetDisplaySettings();
    expect(mmkv.set).toHaveBeenCalledWith('display.themeMode', 'system');
    expect(mmkv.set).toHaveBeenCalledWith('display.fontScaleIndex', '1');
  });
});
