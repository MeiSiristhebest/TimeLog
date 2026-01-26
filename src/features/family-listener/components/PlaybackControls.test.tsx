/**
 * Tests for PlaybackControls component
 *
 * Story 4.2: Secure Streaming Player (AC: 2)
 */

import { render, fireEvent } from '@testing-library/react-native';
import { View as MockView } from 'react-native';
import { PlaybackControls } from './PlaybackControls';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock @react-native-community/slider
jest.mock('@react-native-community/slider', () => {
  return {
    __esModule: true,
    default: (props: {
      accessibilityLabel?: string;
      accessibilityRole?: string;
      onSlidingComplete?: (value: number) => void;
    }) => (
      <MockView
        testID="slider"
        accessibilityLabel={props.accessibilityLabel}
        accessibilityRole={props.accessibilityRole}
      />
    ),
  };
});

describe('PlaybackControls', () => {
  const defaultProps = {
    isPlaying: false,
    isBuffering: false,
    isCompleted: false,
    positionMs: 0,
    durationMs: 180000, // 3 minutes
    onPlayPause: jest.fn(),
    onSeek: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('play/pause button', () => {
    it('shows play button when not playing', () => {
      const { getByLabelText } = render(<PlaybackControls {...defaultProps} isPlaying={false} />);

      expect(getByLabelText('Play')).toBeTruthy();
    });

    it('shows pause button when playing', () => {
      const { getByLabelText } = render(<PlaybackControls {...defaultProps} isPlaying={true} />);

      expect(getByLabelText('Pause')).toBeTruthy();
    });

    it('shows replay button when completed', () => {
      const { getByLabelText } = render(<PlaybackControls {...defaultProps} isCompleted={true} />);

      expect(getByLabelText('Replay')).toBeTruthy();
    });

    it('calls onPlayPause when pressed', () => {
      const onPlayPause = jest.fn();
      const { getByLabelText } = render(
        <PlaybackControls {...defaultProps} onPlayPause={onPlayPause} />
      );

      fireEvent.press(getByLabelText('Play'));

      expect(onPlayPause).toHaveBeenCalledTimes(1);
    });

    it('is disabled when buffering', () => {
      const { getByLabelText } = render(<PlaybackControls {...defaultProps} isBuffering={true} />);

      const button = getByLabelText('Loading');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('time display', () => {
    it('formats position and duration correctly', () => {
      const { getByLabelText } = render(
        <PlaybackControls
          {...defaultProps}
          positionMs={65000} // 1:05
          durationMs={180000} // 3:00
        />
      );

      expect(getByLabelText('Current time 1:05')).toBeTruthy();
      expect(getByLabelText('Total duration 3:00')).toBeTruthy();
    });

    it('handles zero duration', () => {
      const { getByLabelText } = render(
        <PlaybackControls {...defaultProps} positionMs={0} durationMs={0} />
      );

      expect(getByLabelText('Current time 0:00')).toBeTruthy();
      expect(getByLabelText('Total duration 0:00')).toBeTruthy();
    });

    it('handles long durations', () => {
      const { getByLabelText } = render(
        <PlaybackControls
          {...defaultProps}
          positionMs={3600000} // 60:00 (1 hour)
          durationMs={7200000} // 120:00 (2 hours)
        />
      );

      expect(getByLabelText('Current time 60:00')).toBeTruthy();
      expect(getByLabelText('Total duration 120:00')).toBeTruthy();
    });
  });

  describe('buffering state', () => {
    it('shows buffering indicator when buffering', () => {
      const { getByText } = render(<PlaybackControls {...defaultProps} isBuffering={true} />);

      expect(getByText('Loading...')).toBeTruthy();
    });

    it('hides buffering indicator when not buffering', () => {
      const { queryByText } = render(<PlaybackControls {...defaultProps} isBuffering={false} />);

      expect(queryByText('Loading...')).toBeNull();
    });
  });

  describe('completion state', () => {
    it('shows completion message when completed', () => {
      const { getByText } = render(<PlaybackControls {...defaultProps} isCompleted={true} />);

      expect(getByText('Playback completed')).toBeTruthy();
    });

    it('hides completion message when not completed', () => {
      const { queryByText } = render(<PlaybackControls {...defaultProps} isCompleted={false} />);

      expect(queryByText('Playback completed')).toBeNull();
    });

    it('hides completion message when buffering', () => {
      const { queryByText } = render(
        <PlaybackControls {...defaultProps} isCompleted={true} isBuffering={true} />
      );

      expect(queryByText('Playback completed')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has accessible seek bar', () => {
      const { getByLabelText } = render(
        <PlaybackControls {...defaultProps} positionMs={60000} durationMs={180000} />
      );

      const seekBar = getByLabelText('Playback progress 1:00 / 3:00');
      expect(seekBar).toBeTruthy();
    });

    it('play button has correct accessibility role', () => {
      const { getByLabelText } = render(<PlaybackControls {...defaultProps} />);

      const button = getByLabelText('Play');
      expect(button.props.accessibilityRole).toBe('button');
    });
  });
});
