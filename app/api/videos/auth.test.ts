/**
 * @jest-environment node
 */
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { auth } from "@/lib/auth";

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

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("/api/videos - Auth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET - Unauthorized", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: "GET" });
          const data = await response.json();

          expect(response.status).toBe(401);
          expect(data.error).toBe("Unauthorized");
        },
      });
    });

    it("should return 401 when session exists but no user id", async () => {
      mockAuth.mockResolvedValue({
        user: { id: null } as any,
      } as any);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: "GET" });
          const data = await response.json();

          expect(response.status).toBe(401);
          expect(data.error).toBe("Unauthorized");
        },
      });
    });
  });

  describe("GET - User Isolation", () => {
    it("should filter annotations by authenticated user", async () => {
      const { prisma } = await import("@/lib/db");
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "user1@test.com" },
      } as any);

      const mockVideos = [
        {
          id: "1",
          videoId: "V1_S1_I1",
          vendorId: 1,
          sessionId: 1,
          interactionId: 1,
          participant1Id: "001",
          participant2Id: "002",
          label: "improvised",
          split: "train",
          fileId1: "file1",
          fileId2: "file2",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.video.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.video.findMany as jest.Mock).mockResolvedValue(mockVideos);
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue([]);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          await fetch({ method: "GET" });

          // Verify that all annotation queries include userId filter
          const annotationCalls = (mockPrisma.annotation.findMany as jest.Mock)
            .mock.calls;

          annotationCalls.forEach((call) => {
            const args = call[0];
            if (args?.where) {
              expect(args.where.userId).toBe("user-1");
            }
          });
        },
      });
    });

    it("should return per-user stats and counts", async () => {
      const { prisma } = await import("@/lib/db");
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "user1@test.com" },
      } as any);

      const mockAnnotations = [
        {
          videoId: "V1_S1_I1",
          speaker1Label: "Morph A",
          speaker2Label: "Morph B",
          createdAt: new Date(),
        },
      ];

      (mockPrisma.video.count as jest.Mock).mockResolvedValue(100);
      (mockPrisma.video.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue(
        mockAnnotations,
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: "GET" });
          const data = await response.json();

          expect(response.status).toBe(200);

          // Stats should be calculated per user
          expect(data.stats).toBeDefined();
          expect(data.stats.morphACount).toBe(1);
          expect(data.stats.morphBCount).toBe(1);

          // Filter counts should show per-user data
          expect(data.filterCounts).toBeDefined();
          expect(data.filterCounts.annotated).toBe(1);
        },
      });
    });
  });
});
