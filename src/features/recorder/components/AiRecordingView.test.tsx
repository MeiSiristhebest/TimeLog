import { render } from '@testing-library/react-native';
import { AiRecordingView } from './AiRecordingView';

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
      tertiary: '#3B82F6',
      success: '#16A34A',
      warning: '#F59E0B',
      error: '#DC2626',
      primary: '#EA7A5B',
      primarySoft: '#F8B9A7',
      primaryMuted: '#D9826C',
    },
  }),
}));

jest.mock('@/components/ui/Icon', () => ({
  Ionicons: () => null,
}));

jest.mock('./WaveformVisualizer', () => ({
  WaveformVisualizer: () => null,
}));

jest.mock('./RecordingModeSwitcher', () => ({
  RecordingModeSwitcher: () => null,
}));

jest.mock('./ConnectivityBadge', () => ({
  ConnectivityBadge: () => null,
}));

jest.mock('@/components/ui/heritage/BreathingGlow', () => ({
  BreathingGlow: () => null,
}));

jest.mock('./RecordingControls', () => ({
  RecordingControls: () => null,
}));

describe('AiRecordingView', () => {
  it('shows English fallback transcript status when cloud transcript is unavailable', () => {
    const { getByText, queryByText } = render(
      <AiRecordingView
        onStop={jest.fn()}
        onPause={jest.fn()}
        onResume={jest.fn()}
        isOnline
        isCloudConnected={false}
        dialogMode="DEGRADED"
        transcripts={[]}
      />
    );

    expect(getByText('Status')).toBeTruthy();
    expect(getByText('Waiting for connection...')).toBeTruthy();
    expect(queryByText(/[\u4e00-\u9fff]/)).toBeNull();
  });

  it('shows connection hint while cloud dialog is still connecting', () => {
    const { getByText } = render(
      <AiRecordingView
        onStop={jest.fn()}
        onPause={jest.fn()}
        onResume={jest.fn()}
        isOnline
        isCloudConnected={false}
        dialogMode="DIALOG"
      />
    );

    expect(getByText('Status')).toBeTruthy();
    expect(getByText('Waiting for connection...')).toBeTruthy();
  });

  it('shows local-only hint when offline', () => {
    const { getByText } = render(
      <AiRecordingView
        onStop={jest.fn()}
        onPause={jest.fn()}
        onResume={jest.fn()}
        isOnline={false}
        isCloudConnected={false}
      />
    );

    expect(getByText('Status')).toBeTruthy();
    expect(getByText('Waiting for connection...')).toBeTruthy();
  });
});
