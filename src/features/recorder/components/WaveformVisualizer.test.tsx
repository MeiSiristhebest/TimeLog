import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';
import { WaveformVisualizer } from './WaveformVisualizer';

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      primary: '#D97757',
    },
  }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const mockReanimated = jest.requireActual('react-native-reanimated/mock');
  mockReanimated.useSharedValue = jest.fn((initial) => ({
    value: initial,
  }));
  mockReanimated.useDerivedValue = jest.fn((fn) => ({
    value: fn(),
  }));
  mockReanimated.runOnUI = jest.fn((fn) => fn);
  mockReanimated.withTiming = jest.fn((value) => value);
  return mockReanimated;
});

// Mock @shopify/react-native-skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: ReactNode }) => children,
  Path: () => null,
  Skia: {
    Path: {
      Make: jest.fn(() => ({
        addRRect: jest.fn(),
      })),
    },
    RRectXY: jest.fn(),
    XYWHRect: jest.fn(),
  },
}));

// Helper component to provide SharedValue
type TestWrapperProps = {
  amplitudeValue?: number;
  isRecording?: boolean;
  isPaused?: boolean;
};

function TestWrapper({
  amplitudeValue = 0,
  isRecording = false,
  isPaused = false,
}: TestWrapperProps): JSX.Element {
  const amplitude = { value: amplitudeValue };
  return (
    <WaveformVisualizer
      amplitude={amplitude as ReturnType<typeof useSharedValue<number>>}
      isRecording={isRecording}
      isPaused={isPaused}
    />
  );
}

describe('WaveformVisualizer', () => {
  it('renders without crashing when idle', () => {
    render(<TestWrapper />);
    // Component should render without errors
    expect(true).toBe(true);
  });

  it('renders without crashing when recording', () => {
    render(<TestWrapper isRecording={true} amplitudeValue={0.5} />);
    expect(true).toBe(true);
  });

  it('renders without crashing when paused', () => {
    render(<TestWrapper isRecording={true} isPaused={true} amplitudeValue={0.5} />);
    expect(true).toBe(true);
  });

  it('renders without crashing with zero amplitude', () => {
    render(<TestWrapper isRecording={true} amplitudeValue={0} />);
    expect(true).toBe(true);
  });

  it('renders without crashing with max amplitude', () => {
    render(<TestWrapper isRecording={true} amplitudeValue={1} />);
    expect(true).toBe(true);
  });
});
