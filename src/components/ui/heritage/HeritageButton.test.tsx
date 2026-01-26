import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { HeritageButton } from './HeritageButton';

const mockAppText = jest.fn(({ children }: { children: string }) => <Text>{children}</Text>);

jest.mock('@/components/ui/AppText', () => ({
  AppText: (props: { children: string }) => mockAppText(props),
}));

jest.mock('@/components/ui/Icon', () => ({
  Ionicons: () => null,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      primary: '#000000',
      onPrimary: '#ffffff',
      textMuted: '#666666',
      error: '#ff0000',
      disabled: '#cccccc',
      shadow: '#000000',
    },
    spacing: { md: 12, lg: 16, xl: 20 },
    radius: { md: 12, lg: 16 },
    animation: { press: { damping: 10, stiffness: 200, mass: 1 } },
    typography: { body: 24, title: 28, subtitle: 26, caption: 20, label: 22 },
  }),
}));

describe('HeritageButton', () => {
  it('renders title via AppText', () => {
    render(<HeritageButton title="Save" onPress={() => {}} />);
    expect(mockAppText).toHaveBeenCalled();
  });
});
