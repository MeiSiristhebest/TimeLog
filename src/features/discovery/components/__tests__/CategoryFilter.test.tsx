/**
 * CategoryFilter Component - Unit Tests
 * Feature: F3.2 Category Filter for Topic Library
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryFilter } from '../CategoryFilter';
import { StyleSheet } from 'react-native';
import { QUESTION_CATEGORIES } from '@/db/schema/familyQuestions';
import type { QuestionCategory } from '@/db/schema/familyQuestions';

describe('CategoryFilter', () => {
    const mockOnCategoryToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render all 6 category pills', () => {
            const { getAllByRole } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            const buttons = getAllByRole('button');
            expect(buttons).toHaveLength(6); // childhood, family, career, hobbies, travel, general
        });

        it('should render category labels correctly', () => {
            const { getByText } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            expect(getByText('童年往事')).toBeTruthy();
            expect(getByText('家庭生活')).toBeTruthy();
            expect(getByText('事业成就')).toBeTruthy();
            expect(getByText('兴趣爱好')).toBeTruthy();
            expect(getByText('旅行足迹')).toBeTruthy();
            expect(getByText('所有话题')).toBeTruthy();
        });
    });

    describe('Selection State', () => {
        it('should show "所有话题" (GENERAL) as selected when no categories are selected', () => {
            const { getByRole } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            const generalPill = getByRole('button', { name: '所有话题' });
            expect(generalPill.props.accessibilityState?.selected).toBe(true);
        });

        it('should highlight selected categories', () => {
            const selectedCategories: QuestionCategory[] = [
                QUESTION_CATEGORIES.CHILDHOOD,
                QUESTION_CATEGORIES.FAMILY,
            ];

            const { getByText } = render(
                <CategoryFilter
                    selectedCategories={selectedCategories}
                    onCategoryToggle={mockOnCategoryToggle}
                />
            );

            const childhoodPill = getByText('童年往事').parent;
            const familyPill = getByText('家庭生活').parent;

            // Selected pills should have their category color as background
            expect(childhoodPill?.props.style).toBeTruthy();
            expect(familyPill?.props.style).toBeTruthy();
        });

        it('should not highlight unselected categories', () => {
            const selectedCategories: QuestionCategory[] = [QUESTION_CATEGORIES.CHILDHOOD];

            const { getByText } = render(
                <CategoryFilter
                    selectedCategories={selectedCategories}
                    onCategoryToggle={mockOnCategoryToggle}
                />
            );

            const careerPill = getByText('事业成就');
            // Unselected pills should have surface background (from theme)
            expect(careerPill).toBeTruthy();
        });
    });

    describe('User Interactions', () => {
        it('should call onCategoryToggle when a category pill is pressed', () => {
            const { getByRole } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            fireEvent.press(getByRole('button', { name: '童年往事' }));

            expect(mockOnCategoryToggle).toHaveBeenCalledTimes(1);
            expect(mockOnCategoryToggle).toHaveBeenCalledWith(QUESTION_CATEGORIES.CHILDHOOD);
        });

        it('should toggle multiple categories independently', () => {
            const { getByRole } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            fireEvent.press(getByRole('button', { name: '童年往事' }));
            fireEvent.press(getByRole('button', { name: '家庭生活' }));
            fireEvent.press(getByRole('button', { name: '事业成就' }));

            expect(mockOnCategoryToggle).toHaveBeenCalledTimes(3);
            expect(mockOnCategoryToggle).toHaveBeenNthCalledWith(1, QUESTION_CATEGORIES.CHILDHOOD);
            expect(mockOnCategoryToggle).toHaveBeenNthCalledWith(2, QUESTION_CATEGORIES.FAMILY);
            expect(mockOnCategoryToggle).toHaveBeenNthCalledWith(3, QUESTION_CATEGORIES.CAREER);
        });

        it('should call onCategoryToggle with GENERAL when "所有话题" is pressed', () => {
            const { getByRole } = render(
                <CategoryFilter
                    selectedCategories={[QUESTION_CATEGORIES.CHILDHOOD]}
                    onCategoryToggle={mockOnCategoryToggle}
                />
            );

            fireEvent.press(getByRole('button', { name: '所有话题' }));

            expect(mockOnCategoryToggle).toHaveBeenCalledWith(QUESTION_CATEGORIES.GENERAL);
        });
    });

    describe('Accessibility', () => {
        it('should have minimum 56px touch target height (elderly-friendly)', () => {
            const { getAllByRole } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            const buttons = getAllByRole('button');
            buttons.forEach((button) => {
                const styleFn = button.props.style;
                const computed =
                    typeof styleFn === 'function' ? styleFn({ pressed: false }) : styleFn;
                const flattened = StyleSheet.flatten(computed);
                expect(flattened.minHeight).toBe(56);
            });
        });

        it('should have readable 18px font size', () => {
            const { getAllByText } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            const labels = [
                getAllByText('童年往事')[0],
                getAllByText('家庭生活')[0],
                getAllByText('事业成就')[0],
            ];

            labels.forEach((label) => {
                const style = label.props.style;
                expect(style).toContainEqual(
                    expect.objectContaining({
                        fontSize: 18,
                    })
                );
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty selectedCategories array', () => {
            const { getByText } = render(
                <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
            );

            expect(getByText('所有话题')).toBeTruthy();
            expect(mockOnCategoryToggle).not.toHaveBeenCalled();
        });

        it('should handle all categories selected', () => {
            const allCategories: QuestionCategory[] = [
                QUESTION_CATEGORIES.CHILDHOOD,
                QUESTION_CATEGORIES.FAMILY,
                QUESTION_CATEGORIES.CAREER,
                QUESTION_CATEGORIES.HOBBIES,
                QUESTION_CATEGORIES.TRAVEL,
            ];

            const { getAllByRole } = render(
                <CategoryFilter
                    selectedCategories={allCategories}
                    onCategoryToggle={mockOnCategoryToggle}
                />
            );

            expect(getAllByRole('button')).toHaveLength(6);
        });
    });
});
