/**
 * @jest-environment node
 */
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";
import { auth } from "@/lib/auth";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    annotation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("/api/annotations - Auth", () => {
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

  describe("POST - Unauthorized", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: "V1_S1_I1",
              speaker1Label: "Morph A",
              speaker2Label: "Morph B",
            }),
          });
          const data = await response.json();

          expect(response.status).toBe(401);
          expect(data.error).toBe("Unauthorized");
        },
      });
    });
  });

  describe("DELETE - Unauthorized", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      await testApiHandler({
        appHandler,
        url: "/api/annotations?videoId=V1_S1_I1",
        test: async ({ fetch }) => {
          const response = await fetch({ method: "DELETE" });
          const data = await response.json();

          expect(response.status).toBe(401);
          expect(data.error).toBe("Unauthorized");
        },
      });
    });
  });

  describe("Multi-user isolation", () => {
    it("should prevent deleting another user's annotation by id", async () => {
      const { prisma } = await import("@/lib/db");
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      // User tries to delete annotation owned by someone else
      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "user1@test.com" },
      } as any);

      (mockPrisma.annotation.findUnique as jest.Mock).mockResolvedValue({
        id: "123",
        userId: "user-2", // Different user
        videoId: "V1_S1_I1",
      });

      await testApiHandler({
        appHandler,
        url: "/api/annotations?id=123",
        test: async ({ fetch }) => {
          const response = await fetch({ method: "DELETE" });
          const data = await response.json();

          expect(response.status).toBe(404);
          expect(data.error).toBe("Annotation not found or unauthorized");
          expect(mockPrisma.annotation.delete).not.toHaveBeenCalled();
        },
      });
    });

    it("should allow deleting own annotation by id", async () => {
      const { prisma } = await import("@/lib/db");
      const mockPrisma = prisma as jest.Mocked<typeof prisma>;

      mockAuth.mockResolvedValue({
        user: { id: "user-1", email: "user1@test.com" },
      } as any);

      (mockPrisma.annotation.findUnique as jest.Mock).mockResolvedValue({
        id: "123",
        userId: "user-1", // Same user
        videoId: "V1_S1_I1",
      });

      (mockPrisma.annotation.delete as jest.Mock).mockResolvedValue({});

      await testApiHandler({
        appHandler,
        url: "/api/annotations?id=123",
        test: async ({ fetch }) => {
          const response = await fetch({ method: "DELETE" });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(mockPrisma.annotation.delete).toHaveBeenCalledWith({
            where: { id: "123" },
          });
        },
      });
    });
  });
});
