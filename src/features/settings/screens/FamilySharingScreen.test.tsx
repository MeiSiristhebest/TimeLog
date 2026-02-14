import { render } from '@testing-library/react-native';
import { FamilySharingScreen } from './FamilySharingScreen';

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

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      surface: '#ffffff',
      surfaceDim: '#f5f5f5',
      border: '#dddddd',
      primary: '#000000',
      amberCustom: '#ffbf00',
      sageGreen: '#9caf88',
      blueAccent: '#4a90e2',
    },
  }),
}));

jest.mock('../hooks/useSettingsLogic', () => ({
  useFamilySharingLogic: () => ({
    actions: {
      navigateToFamilyMembers: jest.fn(),
      navigateToInvite: jest.fn(),
      navigateToAcceptInvite: jest.fn(),
      navigateToAskQuestion: jest.fn(),
    },
  }),
}));

describe('FamilySharingScreen', () => {
  it('renders family members row', () => {
    const { getByText } = render(<FamilySharingScreen />);
    expect(getByText('Family Members')).toBeTruthy();
  });
});
