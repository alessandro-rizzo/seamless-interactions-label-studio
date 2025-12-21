import { listRemoteInteractions, checkDownloadedInteractions, InteractionInfo } from './dataset-remote';
import fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('dataset-remote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listRemoteInteractions', () => {
    it('should return empty array when CSV is empty', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtimeMs: Date.now() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue('file_id,label,split,batch_idx,archive_idx\n');

      const result = await listRemoteInteractions();
      expect(result).toEqual([]);
    });

    it('should parse CSV and group by interaction', async () => {
      const csvContent = `file_id,label,split,batch_idx,archive_idx
V00_S0001_I00000001_P0001,improvised,dev,0,0
V00_S0001_I00000001_P0002,improvised,dev,0,0
V00_S0001_I00000002_P0003,naturalistic,train,1,0
V00_S0001_I00000002_P0004,naturalistic,train,1,0`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtimeMs: Date.now() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue(csvContent);

      const result = await listRemoteInteractions();

      expect(result.length).toBe(2);
      expect(result[0].videoId).toBe('V00_S0001_I00000001');
      expect(result[0].participant1Id).toBe('0001');
      expect(result[0].participant2Id).toBe('0002');
      expect(result[0].label).toBe('improvised');
      expect(result[1].videoId).toBe('V00_S0001_I00000002');
      expect(result[1].label).toBe('naturalistic');
    });

    it('should filter out incomplete interactions', async () => {
      const csvContent = `file_id,label,split,batch_idx,archive_idx
V00_S0001_I00000001_P0001,improvised,dev,0,0`;
      // Only one participant, should be filtered out

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtimeMs: Date.now() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue(csvContent);

      const result = await listRemoteInteractions();

      expect(result.length).toBe(0);
    });

    it('should download from GitHub if cache is stale', async () => {
      const csvContent = `file_id,label,split,batch_idx,archive_idx
V00_S0001_I00000001_P0001,improvised,dev,0,0
V00_S0001_I00000001_P0002,improvised,dev,0,0`;

      // Cache exists but is old
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtimeMs: Date.now() - 48 * 60 * 60 * 1000 } as fs.Stats);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(csvContent),
      });

      const result = await listRemoteInteractions();

      expect(mockFetch).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it('should handle invalid file IDs gracefully', async () => {
      const csvContent = `file_id,label,split,batch_idx,archive_idx
invalid_file_id,improvised,dev,0,0
V00_S0001_I00000001_P0001,improvised,dev,0,0
V00_S0001_I00000001_P0002,improvised,dev,0,0`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ mtimeMs: Date.now() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue(csvContent);

      const result = await listRemoteInteractions();

      expect(result.length).toBe(1);
      expect(result[0].videoId).toBe('V00_S0001_I00000001');
    });
  });

  describe('checkDownloadedInteractions', () => {
    const mockInteractions: InteractionInfo[] = [
      {
        videoId: 'V00_S0001_I00000001',
        vendorId: 0,
        sessionId: 1,
        interactionId: 1,
        participant1Id: '0001',
        participant2Id: '0002',
        label: 'improvised',
        split: 'dev',
        fileId1: 'V00_S0001_I00000001_P0001',
        fileId2: 'V00_S0001_I00000001_P0002',
        batchIdx: 0,
        archiveIdx: 0,
        isDownloaded: false,
      },
      {
        videoId: 'V00_S0001_I00000002',
        vendorId: 0,
        sessionId: 1,
        interactionId: 2,
        participant1Id: '0003',
        participant2Id: '0004',
        label: 'naturalistic',
        split: 'train',
        fileId1: 'V00_S0001_I00000002_P0003',
        fileId2: 'V00_S0001_I00000002_P0004',
        batchIdx: 1,
        archiveIdx: 0,
        isDownloaded: false,
      },
    ];

    it('should return unchanged interactions if download dir does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await checkDownloadedInteractions(mockInteractions);

      expect(result).toEqual(mockInteractions);
      expect(result[0].isDownloaded).toBe(false);
    });

    it('should mark interactions as downloaded when files exist', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        'V00_S0001_I00000001_P0001.mp4',
        'V00_S0001_I00000001_P0002.mp4',
      ] as unknown as fs.Dirent[]);

      const result = await checkDownloadedInteractions(mockInteractions);

      expect(result[0].isDownloaded).toBe(true);
      expect(result[0].participant1Path).toContain('V00_S0001_I00000001_P0001.mp4');
      expect(result[1].isDownloaded).toBe(false);
    });

    it('should require both participant files to mark as downloaded', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        'V00_S0001_I00000001_P0001.mp4',
        // Missing P0002
      ] as unknown as fs.Dirent[]);

      const result = await checkDownloadedInteractions(mockInteractions);

      expect(result[0].isDownloaded).toBe(false);
    });

    it('should handle readdir errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await checkDownloadedInteractions(mockInteractions);

      expect(result).toEqual(mockInteractions);
    });
  });
});
