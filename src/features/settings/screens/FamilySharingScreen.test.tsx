import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FamilySharingScreen } from './FamilySharingScreen';

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

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      surface: '#ffffff',
      border: '#dddddd',
    },
  }),
}));

describe('FamilySharingScreen', () => {
  it('renders family members row', () => {
    const { getByText } = render(<FamilySharingScreen />);
    expect(getByText('Family Members')).toBeTruthy();
  });
});
