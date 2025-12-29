/**
 * @jest-environment node
 */
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    annotation: {
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuth = auth as unknown as jest.MockedFunction<typeof auth>;

describe("/api/annotations/batch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auth mock to default authenticated state
    // @ts-expect-error - Mocking auth return value
    mockAuth.mockResolvedValue({
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    });
  });

  describe("POST - Batch Delete", () => {
    it("should delete multiple annotations for authenticated user", async () => {
      (mockPrisma.annotation.deleteMany as jest.Mock).mockResolvedValue({
        count: 3,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: ["V1_S1_I1", "V1_S1_I2", "V1_S1_I3"],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.deletedCount).toBe(3);
          expect(mockPrisma.annotation.deleteMany).toHaveBeenCalledWith({
            where: {
              userId: "test-user-id",
              videoId: {
                in: ["V1_S1_I1", "V1_S1_I2", "V1_S1_I3"],
              },
            },
          });
        },
      });
    });

    it("should only delete annotations owned by the user", async () => {
      // Simulate partial deletion - user only owns 2 out of 3 videos
      (mockPrisma.annotation.deleteMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: ["V1_S1_I1", "V1_S1_I2", "V1_S1_I3"],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.deletedCount).toBe(2);
        },
      });
    });

    it("should handle empty videoIds array", async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: [],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.deletedCount).toBe(0);
          expect(mockPrisma.annotation.deleteMany).not.toHaveBeenCalled();
        },
      });
    });

    it("should return 401 for unauthenticated requests", async () => {
      // Mock unauthenticated state
      // @ts-expect-error - Mocking auth return value
      mockAuth.mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: ["V1_S1_I1"],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(401);
          expect(data.error).toBe("Unauthorized");
          expect(mockPrisma.annotation.deleteMany).not.toHaveBeenCalled();
        },
      });
    });

    it("should return 400 for invalid action", async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "invalid",
              videoIds: ["V1_S1_I1"],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toContain("Invalid action");
          expect(mockPrisma.annotation.deleteMany).not.toHaveBeenCalled();
        },
      });
    });

    it("should return 400 when videoIds is not an array", async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: "not-an-array",
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe("videoIds must be an array");
          expect(mockPrisma.annotation.deleteMany).not.toHaveBeenCalled();
        },
      });
    });

    it("should return 400 when videoIds is missing", async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe("videoIds must be an array");
          expect(mockPrisma.annotation.deleteMany).not.toHaveBeenCalled();
        },
      });
    });

    it("should return 500 on database error", async () => {
      (mockPrisma.annotation.deleteMany as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: ["V1_S1_I1"],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe("Internal server error");
        },
      });
    });

    it("should handle single videoId deletion", async () => {
      (mockPrisma.annotation.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: ["V1_S1_I1"],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.deletedCount).toBe(1);
        },
      });
    });

    it("should gracefully handle videoIds with no annotations", async () => {
      // No annotations deleted (videoIds don't have annotations)
      (mockPrisma.annotation.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "delete",
              videoIds: ["V1_S1_I99", "V1_S1_I100"],
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(data.deletedCount).toBe(0);
        },
      });
    });
  });
});
