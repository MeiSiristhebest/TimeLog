import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuestionCard } from './QuestionCard';
import type { TopicQuestion } from '@/types/entities';

jest.mock('@/components/ui/Icon', () => ({
  Ionicons: () => null,
}));

const mockQuestion: TopicQuestion = {
  id: 'q-001',
  text: 'What was your favorite game to play as a child?',
  category: 'childhood',
};

const mockFamilyQuestion: TopicQuestion = {
  id: 'q-002',
  text: 'How did you meet your spouse?',
  category: 'family',
  isFromFamily: true,
  submittedBy: 'Alice',
};

describe('QuestionCard', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const firstArg = args[0];
      if (
        typeof firstArg === 'string' &&
        (firstArg.includes('Each child in a list should have a unique "key" prop.') ||
          firstArg.includes('not wrapped in act'))
      ) {
        return;
      }
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders question text correctly', () => {
    const { getByText } = render(<QuestionCard question={mockQuestion} />);
    expect(getByText(mockQuestion.text)).toBeTruthy();
  });

  it('renders family badge when isFromFamily is true', () => {
    const { getByText } = render(<QuestionCard question={mockFamilyQuestion} />);
    expect(getByText('Asked by Alice')).toBeTruthy();
  });

  it('calls onReplay when Replay button is pressed in recorder variant', () => {
    const onReplay = jest.fn();
    const { getByLabelText } = render(
      <QuestionCard question={mockQuestion} onReplay={onReplay} variant="recorder" />
    );
    fireEvent.press(getByLabelText('Replay'));
    expect(onReplay).toHaveBeenCalled();
  });

  it('calls onNewTopic when Next button is pressed in recorder variant', () => {
    const onNewTopic = jest.fn();
    const { getByLabelText } = render(
      <QuestionCard question={mockQuestion} onNewTopic={onNewTopic} variant="recorder" />
    );
    fireEvent.press(getByLabelText('Next'));
    expect(onNewTopic).toHaveBeenCalled();
  });

  it('renders discovery variant with Record Answer and Next buttons', () => {
    const onRecordThis = jest.fn();
    const onNext = jest.fn();
    const { getByLabelText, getByText } = render(
      <QuestionCard
        question={mockQuestion}
        onRecordThis={onRecordThis}
        onNext={onNext}
        variant="discovery"
      />
    );

    expect(getByText('Record Answer')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();

    fireEvent.press(getByLabelText('Record Answer'));
    expect(onRecordThis).toHaveBeenCalled();

    fireEvent.press(getByLabelText('Next'));
    expect(onNext).toHaveBeenCalled();
  });
});
