import { render } from '@testing-library/react-native';
import { AiConnectingView } from './AiConnectingView';

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    typography: {
      body: 24,
    },
    isDark: false,
    colors: {
      surface: '#F8F6F1',
      surfaceCard: '#FFFFFF',
      border: '#D9D4CA',
      shadow: '#000000',
      textMuted: '#6B7280',
      onSurface: '#111827',
      warning: '#F59E0B',
      success: '#16A34A',
    },
  }),
}));

jest.mock('@/components/ui/Icon', () => ({
  Ionicons: () => null,
}));

jest.mock('@/components/ui/heritage/BreathingGlow', () => ({
  BreathingGlow: () => null,
}));

jest.mock('./ConnectivityBadge', () => ({
  ConnectivityBadge: () => null,
}));

jest.mock('./RecordingModeSwitcher', () => ({
  RecordingModeSwitcher: () => null,
}));

describe('AiConnectingView', () => {
  it('renders dedicated AI loading copy before recording view', () => {
    const { getByText } = render(
      <AiConnectingView
        questionText="What is your favorite childhood memory?"
        isOnline
        dialogMode="DIALOG"
      />
    );

    expect(getByText('PREPARING SESSION')).toBeTruthy();
    expect(getByText('What is your favorite childhood memory?')).toBeTruthy();
    expect(getByText('Connecting to AI Assistant...')).toBeTruthy();
  });

  it('renders offline-safe message when network is unavailable', () => {
    const { getByText } = render(<AiConnectingView isOnline={false} />);
    expect(getByText('OFFLINE SESSION')).toBeTruthy();
    expect(getByText('Tell me about this memory.')).toBeTruthy();
    expect(getByText('Recording locally (Offline)')).toBeTruthy();
  });
});
