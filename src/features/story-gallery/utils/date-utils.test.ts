import { formatDate, formatDuration } from './date-utils';

describe('date-utils', () => {
  describe('formatDuration', () => {
    it('formats milliseconds to mm:ss', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(1000)).toBe('0:01');
      expect(formatDuration(61000)).toBe('1:01');
      expect(formatDuration(125000)).toBe('2:05');
    });
  });

  describe('formatDate', () => {
    it('formats date to English absolute date format', () => {
      const date = new Date('2026-01-15T15:00:00');
      const formatted = formatDate(date);

      expect(formatted).toContain('2026');
      expect(formatted).toContain('15');
      // For en-US locale, year should be preceded/followed by month/day like January 15, 2026
      expect(formatted).toMatch(/2026/);
      expect(formatted).toMatch(/January/);
      expect(formatted).toMatch(/15/);
    });
  });
});
