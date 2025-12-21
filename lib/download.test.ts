import { ensureDownloadDir, deleteInteraction, getDownloadStats } from './download';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path.join to return predictable paths
const originalPathJoin = path.join;

describe('download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureDownloadDir', () => {
    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);

      const result = ensureDownloadDir();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('downloads'),
        { recursive: true }
      );
      expect(result).toContain('downloads');
    });

    it('should not create directory if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = ensureDownloadDir();

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
      expect(result).toContain('downloads');
    });
  });

  describe('deleteInteraction', () => {
    it('should delete both participant files', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockReturnValue(undefined);

      const result = await deleteInteraction('V1_S1_I1_P1', 'V1_S1_I1_P2');

      expect(result.success).toBe(true);
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    it('should succeed even if files do not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await deleteInteraction('V1_S1_I1_P1', 'V1_S1_I1_P2');

      expect(result.success).toBe(true);
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should return error on failure', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await deleteInteraction('V1_S1_I1_P1', 'V1_S1_I1_P2');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should delete only existing files', async () => {
      mockFs.existsSync.mockImplementation((p: fs.PathLike) => {
        return p.toString().includes('P1');
      });
      mockFs.unlinkSync.mockReturnValue(undefined);

      const result = await deleteInteraction('V1_S1_I1_P1', 'V1_S1_I1_P2');

      expect(result.success).toBe(true);
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDownloadStats', () => {
    it('should return stats for downloaded files', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.readdirSync.mockReturnValue([
        'V1_S1_I1_P1.mp4',
        'V1_S1_I1_P2.mp4',
        'V1_S1_I2_P3.mp4',
        'some_other_file.txt',
      ] as any);
      mockFs.statSync.mockReturnValue({ size: 1000000 } as fs.Stats);

      const stats = getDownloadStats();

      expect(stats.downloadedCount).toBe(3); // Only .mp4 files
      expect(stats.totalSize).toBe(3000000);
      expect(stats.downloadDir).toContain('downloads');
    });

    it('should return zero stats when no files', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.readdirSync.mockReturnValue([]);

      const stats = getDownloadStats();

      expect(stats.downloadedCount).toBe(0);
      expect(stats.totalSize).toBe(0);
    });

    it('should create download directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.readdirSync.mockReturnValue([]);

      getDownloadStats();

      expect(mockFs.mkdirSync).toHaveBeenCalled();
    });

    it('should handle files with different sizes', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.readdirSync.mockReturnValue([
        'video1.mp4',
        'video2.mp4',
      ] as any);

      let callCount = 0;
      mockFs.statSync.mockImplementation(() => {
        callCount++;
        return { size: callCount * 500000 } as fs.Stats;
      });

      const stats = getDownloadStats();

      expect(stats.downloadedCount).toBe(2);
      expect(stats.totalSize).toBe(1500000); // 500000 + 1000000
    });
  });
});
