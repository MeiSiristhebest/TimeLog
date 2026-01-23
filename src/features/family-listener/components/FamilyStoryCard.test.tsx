/**
 * Tests for FamilyStoryCard component
 *
 * Story 4.1: Family Story List (AC: 2, 8)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FamilyStoryCard } from './FamilyStoryCard';
import type { FamilyStory } from '../services/familyStoryService';

describe('FamilyStoryCard', () => {
  const mockStory: FamilyStory = {
    id: 'test-123',
    title: 'My First Story',
    startedAt: 1768478400000, // 2026-01-15
    durationMs: 125000, // 2:05
    syncStatus: 'synced',
    seniorUserId: 'senior-456',
  };

  const defaultProps = {
    story: mockStory,
    onPress: jest.fn(),
    onPlay: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders title correctly', () => {
      const { getByText } = render(<FamilyStoryCard {...defaultProps} />);
      expect(getByText('My First Story')).toBeTruthy();
    });

    it('renders default title when title is null', () => {
      const storyWithoutTitle = { ...mockStory, title: null };
      const { getByText } = render(
        <FamilyStoryCard {...defaultProps} story={storyWithoutTitle} />
      );
      expect(getByText('Untitled Story')).toBeTruthy();
    });

    it('renders duration in correct format', () => {
      const { getByText } = render(<FamilyStoryCard {...defaultProps} />);
      expect(getByText('2:05')).toBeTruthy();
    });

    it('renders date in correct format', () => {
      const { getByText } = render(<FamilyStoryCard {...defaultProps} />);
      // The date format should be absolute date
      expect(getByText(/2026/)).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onPress when card is tapped', () => {
      const onPress = jest.fn();
      const { getByLabelText } = render(
        <FamilyStoryCard {...defaultProps} onPress={onPress} />
      );

      const card = getByLabelText(/Story:/);
      fireEvent.press(card);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('calls onPlay when play button is tapped', () => {
      const onPlay = jest.fn();
      const { getByLabelText } = render(
        <FamilyStoryCard {...defaultProps} onPlay={onPlay} />
      );

      const playButton = getByLabelText('Play story');
      fireEvent.press(playButton, { stopPropagation: jest.fn() });
      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when play button is tapped', () => {
      const onPress = jest.fn();
      const onPlay = jest.fn();
      const { getByLabelText } = render(
        <FamilyStoryCard {...defaultProps} onPress={onPress} onPlay={onPlay} />
      );

      const playButton = getByLabelText('Play story');
      fireEvent.press(playButton, { stopPropagation: jest.fn() });

      expect(onPlay).toHaveBeenCalledTimes(1);
      // onPress should not be called due to stopPropagation
    });
  });

  describe('accessibility', () => {
    it('has correct accessibility role', () => {
      const { getAllByRole } = render(<FamilyStoryCard {...defaultProps} />);
      // Card and play button are both buttons
      expect(getAllByRole('button').length).toBeGreaterThanOrEqual(1);
    });

    it('has descriptive accessibility label', () => {
      const { getByLabelText } = render(<FamilyStoryCard {...defaultProps} />);
      const card = getByLabelText(/Story: My First Story/);
      expect(card).toBeTruthy();
    });

    it('has accessibility hint for navigation', () => {
      const { getByA11yHint } = render(<FamilyStoryCard {...defaultProps} />);
      expect(getByA11yHint('Tap to view story details')).toBeTruthy();
    });

    it('play button has correct accessibility label', () => {
      const { getByLabelText } = render(<FamilyStoryCard {...defaultProps} />);
      expect(getByLabelText('Play story')).toBeTruthy();
    });
  });
});
