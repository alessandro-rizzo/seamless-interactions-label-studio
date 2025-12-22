import { prisma } from "./db";

export interface VideoMetadata {
  vendorId: number;
  sessionId: number;
  interactionId: number;
  participant1Id: string;
  participant2Id: string;
  videoId: string; // V{vendor}_S{session}_I{interaction}
  participant1VideoPath: string; // Now contains S3 URL or streaming endpoint path
  participant2VideoPath: string; // Now contains S3 URL or streaming endpoint path
  fileId1: string; // File ID for participant 1
  fileId2: string; // File ID for participant 2
  label: string; // 'improvised' or 'naturalistic'
  split: string; // 'train', 'dev', or 'test'
  metadataPath?: string;
  metadata?: any;
}

/**
 * Construct streaming endpoint URL for a video file
 */
function getStreamingUrl(fileId: string, label: string, split: string): string {
  return `/api/video?fileId=${encodeURIComponent(fileId)}&label=${encodeURIComponent(label)}&split=${encodeURIComponent(split)}`;
}

/**
 * Get all available videos from the database
 * Constructs streaming URLs dynamically from video metadata
 */
export async function getAvailableVideos(): Promise<VideoMetadata[]> {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        videoId: "asc",
      },
    });

    return videos.map((video) => ({
      vendorId: video.vendorId,
      sessionId: video.sessionId,
      interactionId: video.interactionId,
      participant1Id: video.participant1Id,
      participant2Id: video.participant2Id,
      videoId: video.videoId,
      participant1VideoPath: getStreamingUrl(
        video.fileId1,
        video.label,
        video.split,
      ),
      participant2VideoPath: getStreamingUrl(
        video.fileId2,
        video.label,
        video.split,
      ),
      fileId1: video.fileId1,
      fileId2: video.fileId2,
      label: video.label,
      split: video.split,
    }));
  } catch (error) {
    console.error("Error fetching videos from database:", error);
    return [];
  }
}

/**
 * Get video metadata by video ID
 */
export async function getVideoById(
  videoId: string,
): Promise<VideoMetadata | null> {
  try {
    const video = await prisma.video.findUnique({
      where: { videoId },
    });

    if (!video) {
      return null;
    }

    return {
      vendorId: video.vendorId,
      sessionId: video.sessionId,
      interactionId: video.interactionId,
      participant1Id: video.participant1Id,
      participant2Id: video.participant2Id,
      videoId: video.videoId,
      participant1VideoPath: getStreamingUrl(
        video.fileId1,
        video.label,
        video.split,
      ),
      participant2VideoPath: getStreamingUrl(
        video.fileId2,
        video.label,
        video.split,
      ),
      fileId1: video.fileId1,
      fileId2: video.fileId2,
      label: video.label,
      split: video.split,
    };
  } catch (error) {
    console.error("Error fetching video by ID:", error);
    return null;
  }
}

/**
 * Calculate dataset statistics
 */
export async function getDatasetStats() {
  try {
    const videos = await getAvailableVideos();

    return {
      totalVideos: videos.length,
      totalSpeakers: videos.length * 2,
      uniqueVendors: new Set(videos.map((v) => v.vendorId)).size,
      uniqueSessions: new Set(videos.map((v) => `${v.vendorId}_${v.sessionId}`))
        .size,
    };
  } catch (error) {
    console.error("Error calculating dataset stats:", error);
    return {
      totalVideos: 0,
      totalSpeakers: 0,
      uniqueVendors: 0,
      uniqueSessions: 0,
    };
  }
}
