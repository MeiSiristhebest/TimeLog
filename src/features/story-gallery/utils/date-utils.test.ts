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
    it('formats date to English absolute date format by default', () => {
      const date = new Date('2026-01-15T15:00:00');
      const formatted = formatDate(date);

      expect(formatted).toContain('2026');
      expect(formatted).toContain('15');
      expect(formatted).toMatch(/2026/);
      expect(formatted).toMatch(/January/);
      expect(formatted).toMatch(/15/);
    });

    it('formats date to Chinese absolute date format when locale is zh-CN', () => {
      const date = new Date('2026-01-15T15:00:00');
      const formatted = formatDate(date, 'zh-CN');

      expect(formatted).toContain('2026');
      expect(formatted).toContain('15');
      expect(formatted).toMatch(/1月/);
    });
  });
});
