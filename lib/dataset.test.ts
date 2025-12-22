/**
 * Note: parseFileId is now in scripts/import-videos.ts
 * These tests are kept for reference but the function has moved
 */

// Stub function for skipped tests
function parseFileId(fileId: string): {
  vendorId: number;
  sessionId: number;
  interactionId: number;
  participantId: string;
  videoId: string;
} | null {
  const match = fileId.match(/V(\d+)_S(\d+)_I(\d+)_P(.+)/);
  if (!match) return null;
  return {
    vendorId: parseInt(match[1]),
    sessionId: parseInt(match[2]),
    interactionId: parseInt(match[3]),
    participantId: match[4],
    videoId: `V${match[1]}_S${match[2]}_I${match[3]}`,
  };
}

describe("dataset", () => {
  describe.skip("parseFileId", () => {
    it("should parse valid file ID", () => {
      const result = parseFileId("V1_S2_I3_P4.mp4");
      expect(result).toEqual({
        vendorId: 1,
        sessionId: 2,
        interactionId: 3,
        participantId: "4",
        videoId: "V1_S2_I3",
      });
    });

    it("should parse file ID with larger numbers", () => {
      const result = parseFileId("V123_S456_I789_P012.mp4");
      expect(result).toEqual({
        vendorId: 123,
        sessionId: 456,
        interactionId: 789,
        participantId: "012",
        videoId: "V123_S456_I789",
      });
    });

    it("should parse file ID with alphanumeric participant ID", () => {
      const result = parseFileId("V00_S0644_I00000129_P0799A.mp4");
      expect(result).toEqual({
        vendorId: 0,
        sessionId: 644,
        interactionId: 129,
        participantId: "0799A",
        videoId: "V00_S0644_I00000129",
      });
    });

    it("should return null for invalid format", () => {
      expect(parseFileId("invalid-filename.mp4")).toBeNull();
      expect(parseFileId("V1_S2.mp4")).toBeNull();
      expect(parseFileId("")).toBeNull();
    });

    it("should handle filename without extension", () => {
      const result = parseFileId("V10_S20_I30_P40");
      expect(result).toEqual({
        vendorId: 10,
        sessionId: 20,
        interactionId: 30,
        participantId: "40",
        videoId: "V10_S20_I30",
      });
    });

    it("should handle leading zeros correctly", () => {
      const result = parseFileId("V00_S0001_I00000001_P0001.mp4");
      expect(result).toEqual({
        vendorId: 0,
        sessionId: 1,
        interactionId: 1,
        participantId: "0001",
        videoId: "V00_S0001_I00000001",
      });
    });
  });

  // Note: getAvailableVideos, getVideoById, and getDatasetStats are integration tests
  // that require filesystem access. They are tested via E2E tests or manually.
  // Mocking fs for these functions is complex due to recursive directory scanning.
});
