/**
 * @jest-environment node
 */
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { prisma } from "@/lib/db";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    video: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    annotation: {
      findMany: jest.fn(),
    },
  },
}));

describe("/api/videos", () => {
  const mockVideos = [
    {
      id: "1",
      videoId: "V00_S0001_I00000001",
      vendorId: 0,
      sessionId: 1,
      interactionId: 1,
      participant1Id: "0001",
      participant2Id: "0002",
      label: "improvised",
      split: "train",
      fileId1: "V00_S0001_I00000001_P0001",
      fileId2: "V00_S0001_I00000001_P0002",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      videoId: "V00_S0001_I00000002",
      vendorId: 0,
      sessionId: 1,
      interactionId: 2,
      participant1Id: "0003",
      participant2Id: "0004",
      label: "naturalistic",
      split: "dev",
      fileId1: "V00_S0001_I00000002_P0003",
      fileId2: "V00_S0001_I00000002_P0004",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockAnnotations = [
    { videoId: "V00_S0001_I00000001" },
    { videoId: "V00_S0001_I00000003" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return paginated videos with default parameters", async () => {
    (prisma.video.count as jest.Mock).mockResolvedValue(100);
    (prisma.video.findMany as jest.Mock).mockResolvedValue(mockVideos);
    (prisma.annotation.findMany as jest.Mock).mockResolvedValue(
      mockAnnotations,
    );

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.interactions).toHaveLength(2);
        expect(data.page).toBe(1);
        expect(data.limit).toBe(20);
        expect(data.total).toBe(100);
        expect(data.totalPages).toBe(5);
      },
    });
  });

  it("should handle pagination parameters", async () => {
    (prisma.video.count as jest.Mock).mockResolvedValue(100);
    (prisma.video.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.annotation.findMany as jest.Mock).mockResolvedValue([]);

    await testApiHandler({
      appHandler,
      url: "/?page=3&limit=10",
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.page).toBe(3);
        expect(data.limit).toBe(10);
        expect(prisma.video.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 20,
            take: 10,
          }),
        );
      },
    });
  });

  it("should filter by search term", async () => {
    (prisma.video.count as jest.Mock).mockResolvedValue(1);
    (prisma.video.findMany as jest.Mock).mockResolvedValue([mockVideos[0]]);
    (prisma.annotation.findMany as jest.Mock).mockResolvedValue([]);

    await testApiHandler({
      appHandler,
      url: "/?search=V00_S0001_I00000001",
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.interactions).toHaveLength(1);
        expect(prisma.video.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              videoId: {
                contains: "V00_S0001_I00000001",
                mode: "insensitive",
              },
            }),
          }),
        );
      },
    });
  });

  it("should filter by label", async () => {
    (prisma.video.count as jest.Mock).mockResolvedValue(50);
    (prisma.video.findMany as jest.Mock).mockResolvedValue([mockVideos[0]]);
    (prisma.annotation.findMany as jest.Mock).mockResolvedValue([]);

    await testApiHandler({
      appHandler,
      url: "/?labelFilter=improvised",
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });

        expect(response.status).toBe(200);
        expect(prisma.video.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              label: "improvised",
            }),
          }),
        );
      },
    });
  });

  it("should filter by annotated status", async () => {
    (prisma.video.count as jest.Mock).mockResolvedValue(2);
    (prisma.video.findMany as jest.Mock).mockResolvedValue([mockVideos[0]]);
    (prisma.annotation.findMany as jest.Mock).mockResolvedValue(
      mockAnnotations,
    );

    await testApiHandler({
      appHandler,
      url: "/?annotatedFilter=annotated",
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });

        expect(response.status).toBe(200);
        expect(prisma.annotation.findMany).toHaveBeenCalled();
      },
    });
  });

  it("should handle database errors gracefully", async () => {
    (prisma.video.count as jest.Mock).mockRejectedValue(
      new Error("Database error"),
    );

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to fetch videos");
      },
    });
  });

  it("should return filter counts", async () => {
    (prisma.video.count as jest.Mock)
      .mockResolvedValueOnce(100) // total for current filter
      .mockResolvedValueOnce(100) // total count
      .mockResolvedValueOnce(60) // improvised count
      .mockResolvedValueOnce(40); // naturalistic count
    (prisma.video.findMany as jest.Mock).mockResolvedValue(mockVideos);
    (prisma.annotation.findMany as jest.Mock)
      .mockResolvedValueOnce(mockAnnotations) // for page results
      .mockResolvedValueOnce(mockAnnotations); // for filter counts

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const data = await response.json();

        expect(data.filterCounts).toEqual({
          total: 100,
          annotated: 2,
          notAnnotated: 98,
          improvised: 60,
          naturalistic: 40,
        });
      },
    });
  });

  it("should format video paths correctly", async () => {
    (prisma.video.count as jest.Mock).mockResolvedValue(1);
    (prisma.video.findMany as jest.Mock).mockResolvedValue([mockVideos[0]]);
    (prisma.annotation.findMany as jest.Mock).mockResolvedValue([]);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({ method: "GET" });
        const data = await response.json();

        const video = data.interactions[0];
        expect(video.participant1VideoPath).toContain(
          "fileId=V00_S0001_I00000001_P0001",
        );
        expect(video.participant2VideoPath).toContain(
          "fileId=V00_S0001_I00000001_P0002",
        );
      },
    });
  });
});
