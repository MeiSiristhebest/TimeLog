import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuestionCard } from './QuestionCard';
import type { TopicQuestion } from '@/types/entities';

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
  it('renders question text correctly', () => {
    const { getByText } = render(<QuestionCard question={mockQuestion} />);
    expect(getByText(mockQuestion.text)).toBeTruthy();
  });

  it('renders family badge when isFromFamily is true', () => {
    const { getByText } = render(<QuestionCard question={mockFamilyQuestion} />);
    expect(getByText('From Alice')).toBeTruthy();
  });

  it('calls onReplay when Replay button is pressed in recorder variant', () => {
    const onReplay = jest.fn();
    const { getByLabelText } = render(
      <QuestionCard question={mockQuestion} onReplay={onReplay} variant="recorder" />
    );
    fireEvent.press(getByLabelText('Replay question'));
    expect(onReplay).toHaveBeenCalled();
  });

  it('calls onNewTopic when New Topic button is pressed in recorder variant', () => {
    const onNewTopic = jest.fn();
    const { getByLabelText } = render(
      <QuestionCard question={mockQuestion} onNewTopic={onNewTopic} variant="recorder" />
    );
    fireEvent.press(getByLabelText('New topic'));
    expect(onNewTopic).toHaveBeenCalled();
  });

  it('renders discovery variant with Record This and Next buttons', () => {
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

    expect(getByText('Record This')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();

    fireEvent.press(getByLabelText('Record this story'));
    expect(onRecordThis).toHaveBeenCalled();

    fireEvent.press(getByLabelText('Next topic'));
    expect(onNext).toHaveBeenCalled();
  });
});
