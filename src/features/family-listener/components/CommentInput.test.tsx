/**
 * Tests for CommentInput component
 *
 * Story 4.3: Realtime Comment System (AC: 1, 4)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CommentInput } from './CommentInput';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('CommentInput', () => {
  const defaultProps = {
    onSend: jest.fn(),
    isSending: false,
    isOffline: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('input field', () => {
    it('renders with placeholder text', () => {
      const { getByLabelText } = render(<CommentInput {...defaultProps} />);

      const input = getByLabelText('Comment input');
      expect(input).toBeTruthy();
    });

    it('updates text when typing', () => {
      const { getByLabelText } = render(<CommentInput {...defaultProps} />);

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'Hello world');

      expect(input.props.value).toBe('Hello world');
    });

    it('uses custom placeholder when provided', () => {
      const { getByPlaceholderText } = render(
        <CommentInput {...defaultProps} placeholder="Custom placeholder" />
      );

      expect(getByPlaceholderText('Custom placeholder')).toBeTruthy();
    });
  });

  describe('send button', () => {
    it('is disabled when text is empty', () => {
      const { getByLabelText } = render(<CommentInput {...defaultProps} />);

      const button = getByLabelText('Send comment');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });

    it('is enabled when text is entered', () => {
      const { getByLabelText } = render(<CommentInput {...defaultProps} />);

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'Test comment');

      const button = getByLabelText('Send comment');
      expect(button.props.accessibilityState).toEqual({ disabled: false });
    });

    it('calls onSend with trimmed text when pressed', () => {
      const onSend = jest.fn();
      const { getByLabelText } = render(
        <CommentInput {...defaultProps} onSend={onSend} />
      );

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, '  Test comment  ');

      const button = getByLabelText('Send comment');
      fireEvent.press(button);

      expect(onSend).toHaveBeenCalledWith('Test comment');
    });

    it('clears input after sending', () => {
      const { getByLabelText } = render(<CommentInput {...defaultProps} />);

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'Test comment');

      const button = getByLabelText('Send comment');
      fireEvent.press(button);

      expect(input.props.value).toBe('');
    });

    it('is disabled when sending', () => {
      const { getByLabelText } = render(
        <CommentInput {...defaultProps} isSending={true} />
      );

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'Test');

      const button = getByLabelText('Send comment');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('offline state', () => {
    it('shows offline warning when offline', () => {
      const { getByText } = render(
        <CommentInput {...defaultProps} isOffline={true} />
      );

      expect(getByText('Offline: Cannot send comments')).toBeTruthy();
    });

    it('disables send button when offline', () => {
      const { getByLabelText } = render(
        <CommentInput {...defaultProps} isOffline={true} />
      );

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'Test');

      const button = getByLabelText('Send comment');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });

    it('does not call onSend when offline', () => {
      const onSend = jest.fn();
      const { getByLabelText } = render(
        <CommentInput {...defaultProps} onSend={onSend} isOffline={true} />
      );

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'Test');

      const button = getByLabelText('Send comment');
      fireEvent.press(button);

      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('character limit', () => {
    it('shows character count when near limit', () => {
      const { getByLabelText, getByText } = render(
        <CommentInput {...defaultProps} maxLength={100} />
      );

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'a'.repeat(95));

      expect(getByText('95/100')).toBeTruthy();
    });

    it('does not show character count when not near limit', () => {
      const { getByLabelText, queryByText } = render(
        <CommentInput {...defaultProps} maxLength={100} />
      );

      const input = getByLabelText('Comment input');
      fireEvent.changeText(input, 'short text');

      expect(queryByText(/\/100/)).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has accessible input field', () => {
      const { getByLabelText } = render(<CommentInput {...defaultProps} />);

      const input = getByLabelText('Comment input');
      expect(input.props.accessibilityHint).toBe('Max 1000 characters');
    });

    it('send button has correct accessibility role', () => {
      const { getByLabelText } = render(<CommentInput {...defaultProps} />);

      const button = getByLabelText('Send comment');
      expect(button.props.accessibilityRole).toBe('button');
    });
  });
});
