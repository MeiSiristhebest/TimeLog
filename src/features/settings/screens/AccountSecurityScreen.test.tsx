import { render } from '@testing-library/react-native';
import { AccountSecurityScreen } from './AccountSecurityScreen';

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

jest.mock('@/components/ui/heritage/HeritageButton', () => ({
  HeritageButton: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));

jest.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    profile: { displayName: 'Ava', role: 'storyteller' },
    isLoading: false,
    updateProfileData: jest.fn(),
    uploadProfileAvatar: jest.fn(),
  }),
}));

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      surface: '#ffffff',
      border: '#dddddd',
    },
  }),
}));

describe('AccountSecurityScreen', () => {
  it('renders sign out and delete-account rows', () => {
    const { getByText } = render(<AccountSecurityScreen />);
    expect(getByText('Sign Out')).toBeTruthy();
    expect(getByText('Delete Account')).toBeTruthy();
  });
});
