import { render } from '@testing-library/react-native';
import { SettingsRow } from './SettingsRow';

jest.mock('@/components/ui/AppText', () => ({
  AppText: ({ children }: { children: string }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));

jest.mock('@/components/ui/Icon', () => ({
  Icon: () => null,
}));

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      onSurface: '#111111',
      textMuted: '#666666',
      border: '#dddddd',
      surfaceCard: '#ffffff',
      surface: '#ffffff',
    },
  }),
}));

describe('SettingsRow', () => {
  it('renders label and value', () => {
    const { getByText } = render(<SettingsRow label="Dark Mode" value="System" />);
    expect(getByText('Dark Mode')).toBeTruthy();
    expect(getByText('System')).toBeTruthy();
  });
});
