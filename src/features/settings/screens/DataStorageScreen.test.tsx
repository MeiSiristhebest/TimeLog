import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { DataStorageScreen } from './DataStorageScreen';

jest.mock('../components/SettingsRow', () => ({
  SettingsRow: ({ label }: { label: string }) => <Text>{label}</Text>,
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

jest.mock('@/components/ui/AppText', () => ({
  AppText: ({ children }: { children: string }) => <Text>{children}</Text>,
}));

jest.mock('../hooks/useCloudSettings', () => ({
  useCloudSettings: () => ({
    cloudAIEnabled: true,
    isLoading: false,
    setCloudAIEnabled: jest.fn(),
  }),
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

describe('DataStorageScreen', () => {
  it('renders deleted items row', () => {
    const { getByText } = render(<DataStorageScreen />);
    expect(getByText('Deleted Items')).toBeTruthy();
  });
});
