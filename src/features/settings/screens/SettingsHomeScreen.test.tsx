import { fireEvent, render } from '@testing-library/react-native';
import { SettingsHomeScreen } from './SettingsHomeScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

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

jest.mock('../hooks/useSettingsLogic', () => ({
  useSettingsHome: () => ({
    userRole: 'storyteller',
    profile: { displayName: 'Ava' },
    isProfileLoading: false,
    sessionUserId: 'u-1',
  }),
}));

jest.mock('@/features/story-gallery/hooks/useStories', () => ({
  useStories: () => ({ stories: [] }),
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
      border: '#dddddd',
      surfaceDim: '#f5f5f5',
      surfaceCard: '#ffffff',
      onSurface: '#111111',
      textMuted: '#666666',
      primary: '#4a90e2',
      onPrimary: '#ffffff',
      disabled: '#cccccc',
      error: '#ef4444',
      shadow: '#000000',
      iconBlue: '#4a90e2',
      iconOrange: '#f59e0b',
      iconRed: '#ef4444',
    },
    typography: {
      body: 24,
    },
    spacing: {
      md: 12,
      lg: 16,
      xl: 20,
    },
    radius: {
      md: 12,
      lg: 16,
    },
    animation: {
      press: {
        damping: 20,
        stiffness: 300,
      },
    },
  }),
}));

describe('SettingsHomeScreen', () => {
  it('renders settings entry', () => {
    const { getByText } = render(<SettingsHomeScreen />);
    fireEvent.press(getByText('Settings'));
    expect(getByText('My Stories')).toBeTruthy();
  });
});
