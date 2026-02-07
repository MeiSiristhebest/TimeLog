import { act } from '@testing-library/react-native';
import { useDisplaySettingsStore } from './displaySettingsStore';
import * as service from '../services/displaySettingsService';

jest.mock('../services/displaySettingsService');

describe('displaySettingsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrate loads defaults', () => {
    (service.getDisplaySettings as jest.Mock).mockReturnValue({
      themeMode: 'system',
      fontScaleIndex: 1,
    });

    act(() => {
      useDisplaySettingsStore.getState().hydrate();
    });

    const state = useDisplaySettingsStore.getState();
    expect(state.themeMode).toBe('system');
    expect(state.fontScaleIndex).toBe(1);
    expect(state.isLoaded).toBe(true);
  });
});
