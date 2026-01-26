/**
 * Tests for StoryCard component with offline state support.
 * Story 3.6: Offline Access Strategy
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StoryCard } from './StoryCard';

describe('StoryCard', () => {
  const defaultProps = {
    id: 'test-123',
    title: 'My First Story',
    date: new Date('2026-01-15T10:00:00'),
    durationMs: 125000, // 2:05
    syncStatus: 'synced' as const,
    onPress: jest.fn(),
    onPlay: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders title correctly', () => {
      const { getByText } = render(<StoryCard {...defaultProps} />);
      expect(getByText('My First Story')).toBeTruthy();
    });

    it('renders default title when title is null', () => {
      const { getByText } = render(<StoryCard {...defaultProps} title={null} />);
      expect(getByText(/Story/)).toBeTruthy();
    });

    it('renders duration in correct format', () => {
      const { getByText } = render(<StoryCard {...defaultProps} />);
      expect(getByText(/2:05/)).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onPress when card is tapped', () => {
      const onPress = jest.fn();
      const { getByLabelText } = render(<StoryCard {...defaultProps} onPress={onPress} />);

      // Match the label constructed in the component
      const card = getByLabelText(/Story: My First Story/);
      fireEvent.press(card);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPlay when play button is tapped', () => {
      const onPlay = jest.fn();
      const { getByLabelText } = render(<StoryCard {...defaultProps} onPlay={onPlay} />);

      const playButton = getByLabelText('Play story');
      // Must provide stopPropagation mock because the component calls it
      fireEvent.press(playButton, { stopPropagation: jest.fn() });
      expect(onPlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('offline state (Story 3.6)', () => {
    it('shows "Online Only" badge when offline and not playable', () => {
      const { getByText } = render(
        <StoryCard {...defaultProps} isOffline={true} isPlayable={false} />
      );
      expect(getByText('Online Only')).toBeTruthy();
    });

    it('does not show badge when online', () => {
      const { queryByText } = render(
        <StoryCard {...defaultProps} isOffline={false} isPlayable={true} />
      );
      expect(queryByText('Online Only')).toBeNull();
    });

    it('does not show badge when offline but playable (local file)', () => {
      const { queryByText } = render(
        <StoryCard {...defaultProps} isOffline={true} isPlayable={true} />
      );
      expect(queryByText('Online Only')).toBeNull();
    });

    it('disables play button when unavailable', () => {
      const onPlay = jest.fn();
      const { getByLabelText } = render(
        <StoryCard {...defaultProps} isOffline={true} isPlayable={false} onPlay={onPlay} />
      );

      const playButton = getByLabelText('Cannot play');
      fireEvent.press(playButton);
      // Button should be disabled, so onPlay should not be called
      expect(onPlay).not.toHaveBeenCalled();
    });

    it('includes accessibility state for disabled card', () => {
      const { getByLabelText } = render(
        <StoryCard {...defaultProps} isOffline={true} isPlayable={false} />
      );

      // Check that accessibility label includes offline message
      const card = getByLabelText(/This story requires a network connection/);
      expect(card).toBeTruthy();
    });
  });
});
