import { fireEvent, render } from '@testing-library/react-native';
import { DisplayAccessibilityScreen } from './DisplayAccessibilityScreen';

jest.mock('../components/SettingsRow', () => ({
  SettingsRow: ({ label, onPress }: { label: string; onPress?: () => void }) => (
    (() => {
      const { Pressable, Text } = require('react-native');
      return (
        <Pressable onPress={onPress}>
          <Text>{label}</Text>
        </Pressable>
      );
    })()
  ),
}));

jest.mock('../components/SettingsSection', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/SettingsCard', () => ({
  SettingsCard: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/ui/AppText', () => ({
  AppText: ({ children }: { children: string }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));

jest.mock('@/components/ui/heritage/HeritageHeader', () => ({
  HeritageHeader: () => null,
}));

jest.mock('@/theme/heritage', () => ({
  FONT_SCALE_LABELS: [
    'Small',
    'Standard',
    'Large',
    'Extra Large',
    'Huge',
    'Massive',
    'Maximum',
  ],
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

jest.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { language: 'en' },
  }),
}));

jest.mock('../hooks/useSettingsLogic', () => ({
  useDisplaySettingsLogic: () => ({
    state: {
      themeMode: 'system',
    },
    actions: {},
  }),
}));

jest.mock('../utils/languageOptions', () => ({
  getLanguageLabel: () => 'English',
  getSystemLocale: () => 'en',
}));

describe('DisplayAccessibilityScreen', () => {
  it('renders display rows', () => {
    const { getByText } = render(<DisplayAccessibilityScreen />);
    fireEvent.press(getByText('Landscape Mode'));
    expect(getByText('Landscape Mode')).toBeTruthy();
    expect(getByText('Font Size')).toBeTruthy();
    expect(getByText('Multi-language')).toBeTruthy();
    expect(getByText('Translate')).toBeTruthy();
  });
});
