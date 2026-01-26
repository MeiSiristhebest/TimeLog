/**
 * Format duration from milliseconds to human-readable string.
 * e.g., 125000 -> "2:05"
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format date to English absolute date format.
 * e.g., "January 14, 2026 at 3:00 PM"
 */
const DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

export function formatDate(date: Date): string {
  return DATE_FORMATTER.format(date);
}
