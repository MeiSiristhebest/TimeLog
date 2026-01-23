/**
 * CommentBadge Tests
 *
 * Story 4.5: Senior Interaction Feedback (AC: 1, Task 7.1)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { CommentBadge } from './CommentBadge';

describe('CommentBadge', () => {
  describe('Rendering', () => {
    it('renders nothing when count is 0', () => {
      const { queryByTestId } = render(<CommentBadge count={0} />);
      expect(queryByTestId('comment-badge')).toBeNull();
    });

    it('renders badge when count is greater than 0', () => {
      const { getByTestId } = render(<CommentBadge count={3} />);
      expect(getByTestId('comment-badge')).toBeTruthy();
    });

    it('displays exact count for numbers 1-9', () => {
      const { getByText } = render(<CommentBadge count={5} />);
      expect(getByText('5')).toBeTruthy();
    });

    it('displays "9+" for counts greater than 9', () => {
      const { getByText } = render(<CommentBadge count={15} />);
      expect(getByText('9+')).toBeTruthy();
    });

    it('displays count of 1 correctly', () => {
      const { getByText } = render(<CommentBadge count={1} />);
      expect(getByText('1')).toBeTruthy();
    });

    it('displays count of 9 correctly (boundary)', () => {
      const { getByText } = render(<CommentBadge count={9} />);
      expect(getByText('9')).toBeTruthy();
    });

    it('displays "9+" for count of 10 (boundary)', () => {
      const { getByText } = render(<CommentBadge count={10} />);
      expect(getByText('9+')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility label for singular comment', () => {
      const { getByTestId } = render(<CommentBadge count={1} />);
      const badge = getByTestId('comment-badge');
      expect(badge.props.accessibilityLabel).toBe('1 new comment');
    });

    it('has correct accessibility label for plural comments', () => {
      const { getByTestId } = render(<CommentBadge count={5} />);
      const badge = getByTestId('comment-badge');
      expect(badge.props.accessibilityLabel).toBe('5 new comments');
    });

    it('has correct accessibility label for 9+ comments', () => {
      const { getByTestId } = render(<CommentBadge count={15} />);
      const badge = getByTestId('comment-badge');
      expect(badge.props.accessibilityLabel).toBe('15 new comments');
    });

    it('has accessibility role of text', () => {
      const { getByTestId } = render(<CommentBadge count={3} />);
      const badge = getByTestId('comment-badge');
      expect(badge.props.accessibilityRole).toBe('text');
    });
  });

  describe('Styling', () => {
    it('uses Warning/Amber background color (#D4A012)', () => {
      const { getByTestId } = render(<CommentBadge count={3} />);
      const badge = getByTestId('comment-badge');
      // Check that the background color is set in style
      const flattenedStyle = Array.isArray(badge.props.style)
        ? badge.props.style.reduce((acc: object, s: object) => ({ ...acc, ...s }), {})
        : badge.props.style;
      expect(flattenedStyle.backgroundColor).toBe('#D4A012');
    });
  });
});
