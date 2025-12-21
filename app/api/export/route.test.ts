/**
 * @jest-environment node
 */
import { testApiHandler } from 'next-test-api-route-handler';
import * as appHandler from './route';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    annotation: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('/api/export', () => {
  const mockAnnotations = [
    {
      id: '1',
      videoId: 'V1_S1_I1',
      vendorId: 1,
      sessionId: 1,
      interactionId: 1,
      speaker1Id: '001',
      speaker2Id: '002',
      speaker1Label: 'Morph A',
      speaker2Label: 'Morph B',
      speaker1Confidence: 4,
      speaker2Confidence: 3,
      speaker1Comments: 'Test comment with "quotes"',
      speaker2Comments: 'Speaker 2 comment',
      labelingTimeMs: 5000,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
    {
      id: '2',
      videoId: 'V1_S1_I2',
      vendorId: 1,
      sessionId: 1,
      interactionId: 2,
      speaker1Id: '003',
      speaker2Id: '004',
      speaker1Label: 'Morph B',
      speaker2Label: 'Morph A',
      speaker1Confidence: 5,
      speaker2Confidence: 5,
      speaker1Comments: null,
      speaker2Comments: null,
      labelingTimeMs: 3000,
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-01-02T00:00:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should export annotations as JSON by default', async () => {
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue(mockAnnotations);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(response.headers.get('Content-Type')).toBe('application/json');
          expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="annotations-');
          expect(data).toHaveLength(2);
        },
      });
    });

    it('should export annotations as JSON when format=json', async () => {
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue(mockAnnotations);

      await testApiHandler({
        appHandler,
        url: '/api/export?format=json',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(response.headers.get('Content-Type')).toBe('application/json');
          expect(data).toHaveLength(2);
        },
      });
    });

    it('should export annotations as CSV when format=csv', async () => {
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue(mockAnnotations);

      await testApiHandler({
        appHandler,
        url: '/api/export?format=csv',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const csv = await response.text();

          expect(response.status).toBe(200);
          expect(response.headers.get('Content-Type')).toBe('text/csv');
          expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="annotations-');

          // Check CSV structure
          const lines = csv.split('\n');
          expect(lines[0]).toContain('id,videoId,vendorId');
          expect(lines.length).toBe(3); // header + 2 data rows
        },
      });
    });

    it('should properly escape quotes in CSV comments', async () => {
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue(mockAnnotations);

      await testApiHandler({
        appHandler,
        url: '/api/export?format=csv',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const csv = await response.text();

          // Check that quotes are escaped in CSV
          expect(csv).toContain('""quotes""');
        },
      });
    });

    it('should handle empty annotations', async () => {
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue([]);

      await testApiHandler({
        appHandler,
        url: '/api/export?format=csv',
        test: async ({ fetch }) => {
          const response = await fetch({ method: 'GET' });
          const csv = await response.text();

          expect(response.status).toBe(200);
          const lines = csv.split('\n');
          expect(lines.length).toBe(1); // Only header
        },
      });
    });

    it('should return 500 on database error', async () => {
      (mockPrisma.annotation.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

      await testApiHandler({
        appHandler,
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
