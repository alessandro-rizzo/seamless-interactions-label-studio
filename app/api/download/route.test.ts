/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from './route';

// Mock the download library
jest.mock('@/lib/download', () => ({
  downloadInteraction: jest.fn(),
  deleteInteraction: jest.fn(),
  getDownloadStats: jest.fn(),
}));

import { downloadInteraction, deleteInteraction, getDownloadStats } from '@/lib/download';

const mockDownloadInteraction = downloadInteraction as jest.Mock;
const mockDeleteInteraction = deleteInteraction as jest.Mock;
const mockGetDownloadStats = getDownloadStats as jest.Mock;

describe('/api/download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should download interaction successfully', async () => {
      mockDownloadInteraction.mockResolvedValue({
        success: true,
        participant1Path: '/downloads/V1_S1_I1_P1.mp4',
        participant2Path: '/downloads/V1_S1_I1_P2.mp4',
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId1: 'V1_S1_I1_P1',
              fileId2: 'V1_S1_I1_P2',
              label: 'improvised',
              split: 'dev',
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.participant1Path).toContain('V1_S1_I1_P1.mp4');
          expect(mockDownloadInteraction).toHaveBeenCalledWith(
            'V1_S1_I1_P1',
            'V1_S1_I1_P2',
            'improvised',
            'dev',
            undefined
          );
        },
      });
    });

    it('should return 400 when fileId1 is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId2: 'V1_S1_I1_P2',
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe('Missing fileId1 or fileId2');
        },
      });
    });

    it('should return 400 when fileId2 is missing', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId1: 'V1_S1_I1_P1',
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe('Missing fileId1 or fileId2');
        },
      });
    });

    it('should return 500 when download fails', async () => {
      mockDownloadInteraction.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId1: 'V1_S1_I1_P1',
              fileId2: 'V1_S1_I1_P2',
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('Network error');
        },
      });
    });

    it('should return 500 on unexpected error', async () => {
      mockDownloadInteraction.mockRejectedValue(new Error('Unexpected error'));

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId1: 'V1_S1_I1_P1',
              fileId2: 'V1_S1_I1_P2',
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('Unexpected error');
        },
      });
    });
  });

  describe('DELETE', () => {
    it('should delete interaction successfully', async () => {
      mockDeleteInteraction.mockResolvedValue({ success: true });

      await testApiHandler({
        appHandler,
        url: '/api/download?fileId1=V1_S1_I1_P1&fileId2=V1_S1_I1_P2',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'DELETE' });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(mockDeleteInteraction).toHaveBeenCalledWith('V1_S1_I1_P1', 'V1_S1_I1_P2');
        },
      });
    });

    it('should return 400 when fileId1 is missing', async () => {
      await testApiHandler({
        appHandler,
        url: '/api/download?fileId2=V1_S1_I1_P2',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'DELETE' });
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe('Missing fileId1 or fileId2');
        },
      });
    });

    it('should return 500 when delete fails', async () => {
      mockDeleteInteraction.mockResolvedValue({
        success: false,
        error: 'File not found',
      });

      await testApiHandler({
        appHandler,
        url: '/api/download?fileId1=V1_S1_I1_P1&fileId2=V1_S1_I1_P2',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'DELETE' });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('File not found');
        },
      });
    });
  });

  describe('GET', () => {
    it('should return download stats', async () => {
      mockGetDownloadStats.mockReturnValue({
        downloadedCount: 10,
        totalSize: 1024000000,
        downloadDir: '/downloads',
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.downloadedCount).toBe(10);
          expect(data.totalSize).toBe(1024000000);
          expect(data.downloadDir).toBe('/downloads');
        },
      });
    });

    it('should return 500 on error', async () => {
      mockGetDownloadStats.mockImplementation(() => {
        throw new Error('Stats error');
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('Failed to get download stats');
        },
      });
    });
  });
});
