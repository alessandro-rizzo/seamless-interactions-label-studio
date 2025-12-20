import { parseFileId } from '@/lib/dataset';

describe('dataset utilities', () => {
  describe('parseFileId', () => {
    it('should parse valid file ID', () => {
      const result = parseFileId('V1_S2_I3_P4.mp4');
      expect(result).toEqual({
        vendorId: 1,
        sessionId: 2,
        interactionId: 3,
        participantId: 4,
      });
    });

    it('should parse file ID with larger numbers', () => {
      const result = parseFileId('V123_S456_I789_P012.mp4');
      expect(result).toEqual({
        vendorId: 123,
        sessionId: 456,
        interactionId: 789,
        participantId: 12,
      });
    });

    it('should return null for invalid format', () => {
      expect(parseFileId('invalid-filename.mp4')).toBeNull();
      expect(parseFileId('V1_S2.mp4')).toBeNull();
      expect(parseFileId('')).toBeNull();
    });

    it('should handle filename without extension', () => {
      const result = parseFileId('V10_S20_I30_P40');
      expect(result).toEqual({
        vendorId: 10,
        sessionId: 20,
        interactionId: 30,
        participantId: 40,
      });
    });
  });
});
