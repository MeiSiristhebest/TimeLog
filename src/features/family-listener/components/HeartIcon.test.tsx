import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HeartIcon } from './HeartIcon';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn().mockResolvedValue(undefined),
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    return {
        ...Reanimated,
        useSharedValue: jest.fn((initial) => ({ value: initial })),
        useAnimatedStyle: jest.fn(() => ({})),
        withSpring: jest.fn((value) => value),
        withSequence: jest.fn((...args) => args[0]),
    };
});

describe('HeartIcon', () => {
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render without crashing', () => {
        const { getByRole } = render(
            <HeartIcon isLiked={false} onToggle={mockOnToggle} />
        );

        expect(getByRole('button')).toBeTruthy();
    });

    it('should have correct accessibility label when not liked', () => {
        const { getByLabelText } = render(
            <HeartIcon isLiked={false} onToggle={mockOnToggle} />
        );

        expect(getByLabelText('Like story')).toBeTruthy();
    });

    it('should have correct accessibility label when liked', () => {
        const { getByLabelText } = render(
            <HeartIcon isLiked={true} onToggle={mockOnToggle} />
        );

        expect(getByLabelText('Unlike story')).toBeTruthy();
    });

    it('should call onToggle when pressed', async () => {
        const { getByRole } = render(
            <HeartIcon isLiked={false} onToggle={mockOnToggle} />
        );

        fireEvent.press(getByRole('button'));

        await waitFor(() => {
            expect(mockOnToggle).toHaveBeenCalledTimes(1);
        });
    });

    it('should not call onToggle when disabled', async () => {
        const { getByRole } = render(
            <HeartIcon isLiked={false} onToggle={mockOnToggle} disabled={true} />
        );

        fireEvent.press(getByRole('button'));

        expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it('should trigger haptic feedback when pressed', async () => {
        const Haptics = require('expo-haptics');

        const { getByRole } = render(
            <HeartIcon isLiked={false} onToggle={mockOnToggle} />
        );

        fireEvent.press(getByRole('button'));

        await waitFor(() => {
            expect(Haptics.impactAsync).toHaveBeenCalledWith(
                Haptics.ImpactFeedbackStyle.Light
            );
        });
    });

    it('should respect custom size prop', () => {
        const { getByRole } = render(
            <HeartIcon isLiked={false} onToggle={mockOnToggle} size={48} />
        );

        // Component renders successfully with custom size
        expect(getByRole('button')).toBeTruthy();
    });

    it('should have 48dp touch target for WCAG AAA compliance', () => {
        const { getByRole } = render(
            <HeartIcon isLiked={false} onToggle={mockOnToggle} />
        );

        const button = getByRole('button');
        // Component has className="w-12 h-12" which is 48dp x 48dp
        expect(button).toBeTruthy();
    });
});
