import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { DisplayAccessibilityScreen } from './DisplayAccessibilityScreen';

const mockReset = jest.fn();
const mockSetThemeMode = jest.fn();
const mockSetFontScaleIndex = jest.fn();
const mockHydrate = jest.fn();

jest.mock('../store/displaySettingsStore', () => ({
  useDisplaySettingsStore: () => ({
    themeMode: 'system',
    fontScaleIndex: 2,
    isLoaded: true,
    setThemeMode: mockSetThemeMode,
    setFontScaleIndex: mockSetFontScaleIndex,
    reset: mockReset,
    hydrate: mockHydrate,
  }),
}));

jest.mock('../components/SettingsRow', () => ({
  SettingsRow: ({ label, onPress }: { label: string; onPress?: () => void }) => (
    <Pressable onPress={onPress}>
      <Text>{label}</Text>
    </Pressable>
  ),
}));

jest.mock('../components/SettingsSection', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/SettingsCard', () => ({
  SettingsCard: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/ui/AppText', () => ({
  AppText: ({ children }: { children: string }) => <Text>{children}</Text>,
}));

jest.mock('@/components/ui/heritage/HeritageHeader', () => ({
  HeritageHeader: () => null,
}));

jest.mock('@/theme/heritage', () => ({
  FONT_SCALE_LABELS: ['Small', 'Medium', 'Standard', 'Large', 'Extra Large', 'Huge', 'Max'],
  useHeritageTheme: () => ({
    colors: {
      surface: '#ffffff',
      surfaceCard: '#ffffff',
      border: '#dddddd',
      textMuted: '#666666',
      onSurface: '#111111',
      primary: '#000000',
      error: '#ff0000',
    },
  }),
}));

describe('DisplayAccessibilityScreen', () => {
  it('resets to defaults', () => {
    const { getByText } = render(<DisplayAccessibilityScreen />);
    fireEvent.press(getByText('Reset to Defaults'));
    expect(mockReset).toHaveBeenCalled();
  });
});
