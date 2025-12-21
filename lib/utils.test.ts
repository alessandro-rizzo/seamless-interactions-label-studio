import { cn, formatTime, formatNumber } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
      expect(cn('foo', true && 'bar', 'baz')).toBe('foo bar baz');
    });

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
    });
  });

  describe('formatTime', () => {
    it('should format seconds correctly', () => {
      expect(formatTime(5000)).toBe('5s');
      expect(formatTime(30000)).toBe('30s');
    });

    it('should format minutes correctly', () => {
      expect(formatTime(60000)).toBe('1m 0s');
      expect(formatTime(90000)).toBe('1m 30s');
      expect(formatTime(125000)).toBe('2m 5s');
    });

    it('should format hours correctly', () => {
      expect(formatTime(3600000)).toBe('1h 0m 0s');
      expect(formatTime(3665000)).toBe('1h 1m 5s');
      expect(formatTime(7325000)).toBe('2h 2m 5s');
    });

    it('should handle zero', () => {
      expect(formatTime(0)).toBe('0s');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });
  });
});
