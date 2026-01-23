import { formatDate, formatDuration } from './dateUtils';

describe('dateUtils', () => {
    describe('formatDuration', () => {
        it('formats milliseconds to mm:ss', () => {
            expect(formatDuration(0)).toBe('0:00');
            expect(formatDuration(1000)).toBe('0:01');
            expect(formatDuration(61000)).toBe('1:01');
            expect(formatDuration(125000)).toBe('2:05');
        });
    });

    describe('formatDate', () => {
        it('formats date to Chinese absolute date format', () => {
            const date = new Date('2026-01-15T15:00:00');
            // Note: The exact string depends on the runtime's ICU data.
            // In many environments zh-CN with long month looks like "2026年1月15日 15:00"
            // or "2026年1月15日 下午3:00"
            const formatted = formatDate(date);

            expect(formatted).toContain('2026');
            expect(formatted).toContain('1');
            expect(formatted).toContain('15');
            // For zh-CN locale, year should be followed by 年
            expect(formatted).toMatch(/2026年/);
            expect(formatted).toMatch(/1月/);
            expect(formatted).toMatch(/15日/);
        });
    });
});
