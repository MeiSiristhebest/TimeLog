import React from 'react';
import { render } from '@testing-library/react-native';
import { useSharedValue } from 'react-native-reanimated';
import { WaveformVisualizer } from './WaveformVisualizer';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.useSharedValue = jest.fn((initial) => ({
    value: initial,
  }));
  Reanimated.useDerivedValue = jest.fn((fn) => ({
    value: fn(),
  }));
  Reanimated.runOnUI = jest.fn((fn) => fn);
  Reanimated.withTiming = jest.fn((value) => value);
  return Reanimated;
});

// Mock @shopify/react-native-skia
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => children,
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
const TestWrapper: React.FC<{
  amplitudeValue?: number;
  isRecording?: boolean;
  isPaused?: boolean;
}> = ({ amplitudeValue = 0, isRecording = false, isPaused = false }) => {
  const amplitude = { value: amplitudeValue };
  return (
    <WaveformVisualizer
      amplitude={amplitude as ReturnType<typeof useSharedValue<number>>}
      isRecording={isRecording}
      isPaused={isPaused}
    />
  );
};

describe('WaveformVisualizer', () => {
  it('renders without crashing when idle', () => {
    const { getByTestId } = render(<TestWrapper />);
    // Component should render without errors
    expect(true).toBe(true);
  });

  it('renders without crashing when recording', () => {
    const { getByTestId } = render(
      <TestWrapper isRecording={true} amplitudeValue={0.5} />
    );
    expect(true).toBe(true);
  });

  it('renders without crashing when paused', () => {
    const { getByTestId } = render(
      <TestWrapper isRecording={true} isPaused={true} amplitudeValue={0.5} />
    );
    expect(true).toBe(true);
  });

  it('renders without crashing with zero amplitude', () => {
    const { getByTestId } = render(
      <TestWrapper isRecording={true} amplitudeValue={0} />
    );
    expect(true).toBe(true);
  });

  it('renders without crashing with max amplitude', () => {
    const { getByTestId } = render(
      <TestWrapper isRecording={true} amplitudeValue={1} />
    );
    expect(true).toBe(true);
  });
});
