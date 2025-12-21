/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from './route';

// Mock the dataset-remote library
jest.mock('@/lib/dataset-remote', () => ({
  listRemoteInteractions: jest.fn(),
  checkDownloadedInteractions: jest.fn(),
}));

import { listRemoteInteractions, checkDownloadedInteractions } from '@/lib/dataset-remote';

const mockListRemoteInteractions = listRemoteInteractions as jest.Mock;
const mockCheckDownloadedInteractions = checkDownloadedInteractions as jest.Mock;

describe('/api/remote', () => {
  const mockInteractions = [
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
      isDownloaded: true,
      participant1Path: '/downloads/V00_S0001_I00000002_P0003.mp4',
      participant2Path: '/downloads/V00_S0001_I00000002_P0004.mp4',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return list of remote interactions', async () => {
      mockListRemoteInteractions.mockResolvedValue(mockInteractions);
      mockCheckDownloadedInteractions.mockResolvedValue(mockInteractions);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.interactions).toHaveLength(2);
          expect(data.total).toBe(2);
          expect(data.interactions[0].videoId).toBe('V00_S0001_I00000001');
          expect(data.interactions[1].isDownloaded).toBe(true);
        },
      });
    });

    it('should return empty list when no interactions', async () => {
      mockListRemoteInteractions.mockResolvedValue([]);
      mockCheckDownloadedInteractions.mockResolvedValue([]);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.interactions).toHaveLength(0);
          expect(data.total).toBe(0);
        },
      });
    });

    it('should call checkDownloadedInteractions to update download status', async () => {
      const interactionsWithoutDownloadStatus = mockInteractions.map(i => ({
        ...i,
        isDownloaded: false,
      }));

      mockListRemoteInteractions.mockResolvedValue(interactionsWithoutDownloadStatus);
      mockCheckDownloadedInteractions.mockResolvedValue(mockInteractions);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(mockListRemoteInteractions).toHaveBeenCalled();
          expect(mockCheckDownloadedInteractions).toHaveBeenCalledWith(interactionsWithoutDownloadStatus);
          expect(data.interactions[1].isDownloaded).toBe(true);
        },
      });
    });

    it('should return 500 when listRemoteInteractions fails', async () => {
      mockListRemoteInteractions.mockRejectedValue(new Error('GitHub fetch failed'));

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('Failed to list remote interactions');
        },
      });
    });

    it('should return 500 when checkDownloadedInteractions fails', async () => {
      mockListRemoteInteractions.mockResolvedValue(mockInteractions);
      mockCheckDownloadedInteractions.mockRejectedValue(new Error('FS error'));

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('Failed to list remote interactions');
        },
      });
    });
  });
});
