/**
 * Mock Data for Home Feature
 * Adhering to reactcomponents skill
 */

export const HOME_STRINGS = {
  greetings: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
  },
  weather: {
    unit: '°C',
    loading: 'Loading weather...',
  },
  questionCard: {
    defaultQuestion: 'What was your favorite toy?',
    answeredBadge: 'Answered',
    newQuestionButton: 'New Question',
  },
  recording: {
    tapToRecord: 'Tap to Record',
    startError: 'Failed to start recording. Please try again.',
    stopError: 'Failed to stop recording. Please try again.',
  },
  notification: {
    liked: 'liked',
    commented: 'commented on',
  },
  categories: {
    childhood: 'My Childhood',
    family: 'My Family',
    career: 'My Career',
    memories: 'My Memories',
    wisdom: 'My Wisdom',
    default: 'My Story',
  },
} as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
