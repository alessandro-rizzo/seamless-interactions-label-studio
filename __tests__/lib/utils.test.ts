import { formatTime, formatNumber } from '@/lib/utils';

describe('utils', () => {
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
