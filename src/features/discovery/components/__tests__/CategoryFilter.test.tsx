import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { CategoryFilter } from '../CategoryFilter';
import { QUESTION_CATEGORIES } from '@/db/schema/familyQuestions';
import type { QuestionCategory } from '@/db/schema/familyQuestions';

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      surface: '#ffffff',
      border: '#e0e0e0',
      textMuted: '#666666',
    },
    typography: {
      body: 24,
    },
  }),
}));

jest.mock('@/components/ui/AppText', () => ({
  AppText: ({ children }: { children: React.ReactNode }) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));

jest.mock('@/components/ui/Icon', () => ({
  Ionicons: () => null,
}));

describe('CategoryFilter', () => {
  const mockOnCategoryToggle = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.includes('Each child in a list should have a unique "key" prop.')) {
        return;
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders all available category pills', () => {
    const { getAllByRole } = render(
      <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
    );

    expect(getAllByRole('button')).toHaveLength(6);
  });

  it('renders current category labels', () => {
    const { getByText } = render(
      <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
    );

    expect(getByText('General')).toBeTruthy();
    expect(getByText('Childhood')).toBeTruthy();
    expect(getByText('Family')).toBeTruthy();
    expect(getByText('Career')).toBeTruthy();
    expect(getByText('Hobbies')).toBeTruthy();
    expect(getByText('Travel')).toBeTruthy();
  });

  it('selects GENERAL by default when selectedCategories is empty', () => {
    const { getByRole } = render(
      <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
    );

    expect(getByRole('button', { name: 'General' }).props.accessibilityState?.selected).toBe(true);
  });

  it('shows explicit selected state for selected category', () => {
    const selectedCategories: QuestionCategory[] = [QUESTION_CATEGORIES.CHILDHOOD];
    const { getByRole } = render(
      <CategoryFilter
        selectedCategories={selectedCategories}
        onCategoryToggle={mockOnCategoryToggle}
      />
    );

    expect(getByRole('button', { name: 'Childhood' }).props.accessibilityState?.selected).toBe(true);
    expect(getByRole('button', { name: 'General' }).props.accessibilityState?.selected).toBe(false);
  });

  it('calls onCategoryToggle with the tapped category', () => {
    const { getByRole } = render(
      <CategoryFilter selectedCategories={[]} onCategoryToggle={mockOnCategoryToggle} />
    );

    fireEvent.press(getByRole('button', { name: 'Family' }));

    expect(mockOnCategoryToggle).toHaveBeenCalledTimes(1);
    expect(mockOnCategoryToggle).toHaveBeenCalledWith(QUESTION_CATEGORIES.FAMILY);
  });
});
