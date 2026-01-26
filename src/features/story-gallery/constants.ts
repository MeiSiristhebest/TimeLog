export const STORY_ACCESSIBILITY = {
  UNAVAILABLE_LABEL: (title: string, date: string, comments: string) =>
    `Story: ${title}, ${date}, This story requires a network connection${comments}`,
  AVAILABLE_LABEL: (title: string, date: string, comments: string) =>
    `Story: ${title}, ${date}${comments}`,
  UNAVAILABLE_HINT: 'This story requires a network connection',
  AVAILABLE_HINT: 'Tap to view story details',
  ONLINE_ONLY_BADGE: 'Online Only',
};
