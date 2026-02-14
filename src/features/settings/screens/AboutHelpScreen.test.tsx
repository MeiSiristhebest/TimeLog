import { render } from '@testing-library/react-native';
import { AboutHelpScreen } from './AboutHelpScreen';

jest.mock('../components/SettingsRow', () => ({
  SettingsRow: ({ label }: { label: string }) => {
    const { Text } = require('react-native');
    return <Text>{label}</Text>;
  },
}));

jest.mock('../components/SettingsSection', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../components/SettingsCard', () => ({
  SettingsCard: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/ui/heritage/HeritageHeader', () => ({
  HeritageHeader: () => null,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
  },
}));

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      surface: '#ffffff',
      border: '#dddddd',
      textMuted: '#666666',
    },
  }),
}));

describe('AboutHelpScreen', () => {
  it('renders help center row', () => {
    const { getByText } = render(<AboutHelpScreen />);
    expect(getByText('Help Center')).toBeTruthy();
  });
});
