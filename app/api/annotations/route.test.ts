/**
 * @jest-environment node
 */
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "./route";

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    }),
  ),
}));

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    annotation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    video: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/annotations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return all annotations", async () => {
      const mockAnnotations = [
        {
          id: "1",
          videoId: "V1_S1_I1",
          vendorId: 1,
          sessionId: 1,
          interactionId: 1,
          speaker1Id: "001",
          speaker2Id: "002",
          speaker1Label: "Morph A",
          speaker2Label: "Morph B",
          speaker1Confidence: 4,
          speaker2Confidence: 3,
          speaker1Comments: "",
          speaker2Comments: "",
          labelingTimeMs: 5000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue(
        mockAnnotations,
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: "GET" });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data).toHaveLength(1);
          expect(data[0].videoId).toBe("V1_S1_I1");
        },
      });
    });

    it("should return 500 on database error", async () => {
      (mockPrisma.annotation.findMany as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({ method: "GET" });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe("Internal server error");
        },
      });
    });
  });

  describe("POST", () => {
    it("should create a new annotation with manual type when labelingTimeMs > 0", async () => {
      const newAnnotation = {
        id: "1",
        videoId: "V1_S1_I1",
        vendorId: 1,
        sessionId: 1,
        interactionId: 1,
        speaker1Id: "001",
        speaker2Id: "002",
        speaker1Label: "Morph A",
        speaker2Label: "Morph B",
        speaker1Confidence: 4,
        speaker2Confidence: 3,
        speaker1Comments: "",
        speaker2Comments: "",
        labelingTimeMs: 5000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.annotation.upsert as jest.Mock).mockResolvedValue(
        newAnnotation,
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: "V1_S1_I1",
              vendorId: 1,
              sessionId: 1,
              interactionId: 1,
              speaker1Id: "001",
              speaker2Id: "002",
              speaker1Label: "Morph A",
              speaker2Label: "Morph B",
              speaker1Confidence: 4,
              speaker2Confidence: 3,
              labelingTimeMs: 5000,
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.videoId).toBe("V1_S1_I1");
          expect(mockPrisma.annotation.upsert).toHaveBeenCalled();
        },
      });
    });

    it("should create annotation with extrapolated type when labelingTimeMs = 0", async () => {
      const newAnnotation = {
        id: "1",
        videoId: "V1_S1_I1",
        vendorId: 1,
        sessionId: 1,
        interactionId: 1,
        speaker1Id: "001",
        speaker2Id: "002",
        speaker1Label: "Morph A",
        speaker2Label: "Morph B",
        speaker1Confidence: 4,
        speaker2Confidence: 3,
        speaker1Comments: "",
        speaker2Comments: "",
        labelingTimeMs: 0,
        annotationType: "extrapolated",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.annotation.upsert as jest.Mock).mockResolvedValue(
        newAnnotation,
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: "V1_S1_I1",
              vendorId: 1,
              sessionId: 1,
              interactionId: 1,
              speaker1Id: "001",
              speaker2Id: "002",
              speaker1Label: "Morph A",
              speaker2Label: "Morph B",
              speaker1Confidence: 4,
              speaker2Confidence: 3,
              labelingTimeMs: 0,
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(200);
          expect(mockPrisma.annotation.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
              create: expect.objectContaining({
                annotationType: "extrapolated",
              }),
              update: expect.objectContaining({
                annotationType: "extrapolated",
              }),
            }),
          );
        },
      });
    });

    it("should extrapolate to session when extrapolateToSession is true", async () => {
      const newAnnotation = {
        id: "1",
        videoId: "V1_S1_I1",
        vendorId: 1,
        sessionId: 1,
        interactionId: 1,
        speaker1Id: "001",
        speaker2Id: "002",
        speaker1Label: "Morph A",
        speaker2Label: "Morph B",
        speaker1Confidence: 4,
        speaker2Confidence: 3,
        labelingTimeMs: 5000,
        annotationType: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock session videos
      (mockPrisma.video.findMany as jest.Mock).mockResolvedValue([
        {
          videoId: "V1_S1_I2",
          vendorId: 1,
          sessionId: 1,
          interactionId: 2,
          participant1Id: "003",
          participant2Id: "004",
        },
        {
          videoId: "V1_S1_I3",
          vendorId: 1,
          sessionId: 1,
          interactionId: 3,
          participant1Id: "005",
          participant2Id: "006",
        },
      ]);

      // Mock existing annotations (empty - no videos annotated yet)
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue([]);

      (mockPrisma.annotation.upsert as jest.Mock).mockResolvedValue(
        newAnnotation,
      );
      (mockPrisma.annotation.createMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: "V1_S1_I1",
              vendorId: 1,
              sessionId: 1,
              interactionId: 1,
              speaker1Id: "001",
              speaker2Id: "002",
              speaker1Label: "Morph A",
              speaker2Label: "Morph B",
              speaker1Confidence: 4,
              speaker2Confidence: 3,
              labelingTimeMs: 5000,
              extrapolateToSession: true,
            }),
          });

          expect(response.status).toBe(200);
          expect(mockPrisma.video.findMany).toHaveBeenCalledWith({
            where: {
              vendorId: 1,
              sessionId: 1,
              videoId: { not: "V1_S1_I1" },
            },
          });
          expect(mockPrisma.annotation.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
              expect.objectContaining({
                videoId: "V1_S1_I2",
                speaker1Label: "Morph A",
                speaker2Label: "Morph B",
                labelingTimeMs: 0,
                annotationType: "extrapolated",
              }),
              expect.objectContaining({
                videoId: "V1_S1_I3",
                speaker1Label: "Morph A",
                speaker2Label: "Morph B",
                labelingTimeMs: 0,
                annotationType: "extrapolated",
              }),
            ]),
            skipDuplicates: true,
          });
        },
      });
    });

    it("should skip already annotated videos when extrapolating", async () => {
      const newAnnotation = {
        id: "1",
        videoId: "V1_S1_I1",
        vendorId: 1,
        sessionId: 1,
        interactionId: 1,
        speaker1Id: "001",
        speaker2Id: "002",
        speaker1Label: "Morph A",
        speaker2Label: "Morph B",
        speaker1Confidence: 4,
        speaker2Confidence: 3,
        labelingTimeMs: 5000,
        annotationType: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock session videos
      (mockPrisma.video.findMany as jest.Mock).mockResolvedValue([
        {
          videoId: "V1_S1_I2",
          vendorId: 1,
          sessionId: 1,
          interactionId: 2,
          participant1Id: "003",
          participant2Id: "004",
        },
        {
          videoId: "V1_S1_I3",
          vendorId: 1,
          sessionId: 1,
          interactionId: 3,
          participant1Id: "005",
          participant2Id: "006",
        },
      ]);

      // Mock existing annotations (V1_S1_I2 already annotated)
      (mockPrisma.annotation.findMany as jest.Mock).mockResolvedValue([
        { videoId: "V1_S1_I2" },
      ]);

      (mockPrisma.annotation.upsert as jest.Mock).mockResolvedValue(
        newAnnotation,
      );
      (mockPrisma.annotation.createMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: "V1_S1_I1",
              vendorId: 1,
              sessionId: 1,
              interactionId: 1,
              speaker1Id: "001",
              speaker2Id: "002",
              speaker1Label: "Morph A",
              speaker2Label: "Morph B",
              speaker1Confidence: 4,
              speaker2Confidence: 3,
              labelingTimeMs: 5000,
              extrapolateToSession: true,
            }),
          });

          expect(response.status).toBe(200);
          // Should only create annotation for V1_S1_I3 (not V1_S1_I2)
          expect(mockPrisma.annotation.createMany).toHaveBeenCalledWith({
            data: [
              expect.objectContaining({
                videoId: "V1_S1_I3",
                labelingTimeMs: 0,
                annotationType: "extrapolated",
              }),
            ],
            skipDuplicates: true,
          });
        },
      });
    });

    it("should not extrapolate when extrapolateToSession is false", async () => {
      const newAnnotation = {
        id: "1",
        videoId: "V1_S1_I1",
        vendorId: 1,
        sessionId: 1,
        interactionId: 1,
        speaker1Id: "001",
        speaker2Id: "002",
        speaker1Label: "Morph A",
        speaker2Label: "Morph B",
        speaker1Confidence: 4,
        speaker2Confidence: 3,
        labelingTimeMs: 5000,
        annotationType: "manual",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.annotation.upsert as jest.Mock).mockResolvedValue(
        newAnnotation,
      );

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: "V1_S1_I1",
              vendorId: 1,
              sessionId: 1,
              interactionId: 1,
              speaker1Id: "001",
              speaker2Id: "002",
              speaker1Label: "Morph A",
              speaker2Label: "Morph B",
              speaker1Confidence: 4,
              speaker2Confidence: 3,
              labelingTimeMs: 5000,
              extrapolateToSession: false,
            }),
          });

          expect(response.status).toBe(200);
          expect(mockPrisma.video.findMany).not.toHaveBeenCalled();
          expect(mockPrisma.annotation.createMany).not.toHaveBeenCalled();
        },
      });
    });

    it("should return 400 when required fields are missing", async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const response = await fetch({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId: "V1_S1_I1",
              // Missing speaker1Label and speaker2Label
            }),
          });

          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe("Missing required fields");
        },
      });
    });

    it("should return 500 on database error", async () => {
      (mockPrisma.annotation.upsert as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

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

          expect(response.status).toBe(500);
          expect(data.error).toBe("Internal server error");
        },
      });
    });
  });

  describe("DELETE", () => {
    it("should delete annotation by videoId", async () => {
      (mockPrisma.annotation.delete as jest.Mock).mockResolvedValue({});

      await testApiHandler({
        appHandler,
        url: "/api/annotations?videoId=V1_S1_I1",
        test: async ({ fetch }) => {
          const response = await fetch({ method: "DELETE" });
          const data = await response.json();

          expect(response.status).toBe(200);
          expect(data.success).toBe(true);
          expect(mockPrisma.annotation.delete).toHaveBeenCalledWith({
            where: {
              userId_videoId: {
                userId: "test-user-id",
                videoId: "V1_S1_I1",
              },
            },
          });
        },
      });
    });

    it("should delete annotation by id", async () => {
      // Mock findUnique to return an annotation owned by test user
      (mockPrisma.annotation.findUnique as jest.Mock).mockResolvedValue({
        id: "123",
        userId: "test-user-id",
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

    it("should return 400 when id and videoId are missing", async () => {
      await testApiHandler({
        appHandler,
        url: "/api/annotations",
        test: async ({ fetch }) => {
          const response = await fetch({ method: "DELETE" });
          const data = await response.json();

          expect(response.status).toBe(400);
          expect(data.error).toBe("Missing annotation ID or videoId");
        },
      });
    });

    it("should return 500 on database error", async () => {
      (mockPrisma.annotation.delete as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await testApiHandler({
        appHandler,
        url: "/api/annotations?videoId=V1_S1_I1",
        test: async ({ fetch }) => {
          const response = await fetch({ method: "DELETE" });
          const data = await response.json();

          expect(response.status).toBe(500);
          expect(data.error).toBe("Internal server error");
        },
      });
    });
  });
});
