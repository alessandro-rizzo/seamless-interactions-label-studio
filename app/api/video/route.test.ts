/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from './route';
import { Readable } from 'stream';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  statSync: jest.fn(),
  createReadStream: jest.fn(),
}));

import fs from 'fs';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('/api/video', () => {
  const downloadsPath = `${process.cwd()}/downloads`;
  const validVideoPath = `${downloadsPath}/V1_S1_I1_P1.mp4`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 400 when path parameter is missing', async () => {
      await testApiHandler({
        appHandler,
        url: '/api/video',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe('Missing path parameter');
        },
      });
    });

    it('should return 403 for invalid path (outside allowed directories)', async () => {
      await testApiHandler({
        appHandler,
        url: '/api/video?path=/etc/passwd',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(403);
          expect(data.error).toBe('Invalid path');
        },
      });
    });

    it('should return 403 for path traversal attempt', async () => {
      await testApiHandler({
        appHandler,
        url: `/api/video?path=${downloadsPath}/../../../etc/passwd`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(403);
          expect(data.error).toBe('Invalid path');
        },
      });
    });

    it('should return 404 when video file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await testApiHandler({
        appHandler,
        url: `/api/video?path=${validVideoPath}`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(404);
          expect(data.error).toBe('Video not found');
        },
      });
    });

    it('should stream video with correct headers (no range request)', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 1000000 } as fs.Stats);

      const mockStream = new Readable({
        read() {
          this.push(Buffer.from('video data'));
          this.push(null);
        },
      });
      mockFs.createReadStream.mockReturnValue(mockStream as any);

      await testApiHandler({
        appHandler,
        url: `/api/video?path=${validVideoPath}`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });

          expect(response.status).toBe(200);
          expect(response.headers.get('Content-Type')).toBe('video/mp4');
          expect(response.headers.get('Content-Length')).toBe('1000000');
        },
      });
    });

    it('should handle range request (partial content)', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 1000000 } as fs.Stats);

      const mockStream = new Readable({
        read() {
          this.push(Buffer.from('partial video data'));
          this.push(null);
        },
      });
      mockFs.createReadStream.mockReturnValue(mockStream as any);

      await testApiHandler({
        appHandler,
        url: `/api/video?path=${validVideoPath}`,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: { Range: 'bytes=0-499' },
          });

          expect(response.status).toBe(206);
          expect(response.headers.get('Content-Type')).toBe('video/mp4');
          expect(response.headers.get('Content-Range')).toBe('bytes 0-499/1000000');
          expect(response.headers.get('Accept-Ranges')).toBe('bytes');
          expect(response.headers.get('Content-Length')).toBe('500');

          expect(mockFs.createReadStream).toHaveBeenCalledWith(
            validVideoPath,
            { start: 0, end: 499 }
          );
        },
      });
    });

    it('should handle range request without end', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ size: 1000000 } as fs.Stats);

      const mockStream = new Readable({
        read() {
          this.push(Buffer.from('partial video data'));
          this.push(null);
        },
      });
      mockFs.createReadStream.mockReturnValue(mockStream as any);

      await testApiHandler({
        appHandler,
        url: `/api/video?path=${validVideoPath}`,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: 'GET',
            headers: { Range: 'bytes=500000-' },
          });

          expect(response.status).toBe(206);
          expect(response.headers.get('Content-Range')).toBe('bytes 500000-999999/1000000');

          expect(mockFs.createReadStream).toHaveBeenCalledWith(
            validVideoPath,
            { start: 500000, end: 999999 }
          );
        },
      });
    });

    it('should return 500 on error', async () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('FS error');
      });

      await testApiHandler({
        appHandler,
        url: `/api/video?path=${validVideoPath}`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('Internal server error');
        },
      });
    });
  });
});
