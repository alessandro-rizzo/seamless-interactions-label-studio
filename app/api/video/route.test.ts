/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from './route';

// Mock global fetch for S3 requests
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Helper to create a mock ReadableStream
function createMockReadableStream(data: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(data));
      controller.close();
    },
  });
}

describe('/api/video', () => {
  const validFileId = 'V00_S0644_I00000129_P0799';
  const label = 'improvised';
  const split = 'dev';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 400 when fileId parameter is missing', async () => {
      await testApiHandler({
        appHandler,
        url: '/api/video',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe('Missing fileId parameter');
        },
      });
    });

    it('should stream video from S3 with correct headers (no range request)', async () => {
      const mockStream = createMockReadableStream('video data');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStream,
        headers: new Headers({
          'Content-Type': 'video/mp4',
          'Content-Length': '1000000',
        }),
      });

      await testApiHandler({
        appHandler,
        url: `/api/video?fileId=${validFileId}&label=${label}&split=${split}`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });

          expect(response.status).toBe(200);
          expect(response.headers.get('Content-Type')).toBe('video/mp4');
          expect(response.headers.get('Accept-Ranges')).toBe('bytes');
          expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');

          // Verify S3 URL was constructed correctly
          expect(mockFetch).toHaveBeenCalledWith(
            'https://dl.fbaipublicfiles.com/seamless_interaction/improvised/dev/video/V00_S0644_I00000129_P0799.mp4',
            expect.objectContaining({
              headers: {},
              redirect: 'follow',
            })
          );
        },
      });
    });

    it('should handle range request (partial content)', async () => {
      const mockStream = createMockReadableStream('partial video data');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 206,
        body: mockStream,
        headers: new Headers({
          'Content-Type': 'video/mp4',
          'Content-Length': '500',
          'Content-Range': 'bytes 0-499/1000000',
        }),
      });

      await testApiHandler({
        appHandler,
        url: `/api/video?fileId=${validFileId}&label=${label}&split=${split}`,
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

          // Verify range header was passed to S3
          expect(mockFetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              headers: { Range: 'bytes=0-499' },
            })
          );
        },
      });
    });

    it('should use default label and split when not provided', async () => {
      const mockStream = createMockReadableStream('video data');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockStream,
        headers: new Headers({
          'Content-Type': 'video/mp4',
        }),
      });

      await testApiHandler({
        appHandler,
        url: `/api/video?fileId=${validFileId}`,
        test: async ({ fetch }) => {
          await fetch({ method: 'GET' });

          // Verify default label=improvised and split=dev were used
          expect(mockFetch).toHaveBeenCalledWith(
            'https://dl.fbaipublicfiles.com/seamless_interaction/improvised/dev/video/V00_S0644_I00000129_P0799.mp4',
            expect.any(Object)
          );
        },
      });
    });

    it('should return 404 when video not found on S3', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      });

      await testApiHandler({
        appHandler,
        url: `/api/video?fileId=${validFileId}&label=${label}&split=${split}`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(404);
          expect(data.error).toContain('Video not found');
        },
      });
    });

    it('should return 500 on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await testApiHandler({
        appHandler,
        url: `/api/video?fileId=${validFileId}&label=${label}&split=${split}`,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe('Failed to stream video');
        },
      });
    });
  });
});
