import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { SettingsHomeScreen } from './SettingsHomeScreen';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
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

jest.mock('../store/displaySettingsStore', () => ({
  useDisplaySettingsStore: () => ({
    themeMode: 'system',
    fontScaleIndex: 1,
  }),
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
    },
  }),
}));

describe('SettingsHomeScreen', () => {
  it('navigates to display screen', () => {
    const { getByText } = render(<SettingsHomeScreen />);
    fireEvent.press(getByText('Display & Accessibility'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/settings/display-accessibility');
  });
});
