import { prisma } from "@/lib/db";
import { VideoList } from "@/components/video-list";

// Force dynamic rendering - page is too large to pre-render (64,000+ videos)
export const dynamic = "force-dynamic";

// Cache for 5 minutes
export const revalidate = 300;

export default async function VideosPage() {
  // Query videos directly from database
  const [videos, annotations] = await Promise.all([
    prisma.video.findMany({
      orderBy: [
        { vendorId: "asc" },
        { sessionId: "asc" },
        { interactionId: "asc" },
      ],
    }),
    prisma.annotation.findMany({
      select: { videoId: true },
    }),
  ]);

  // Convert Video model to VideoMetadata format for compatibility
  const interactions = videos.map((video) => ({
    videoId: video.videoId,
    vendorId: video.vendorId,
    sessionId: video.sessionId,
    interactionId: video.interactionId,
    participant1Id: video.participant1Id,
    participant2Id: video.participant2Id,
    label: video.label,
    split: video.split,
    fileId1: video.fileId1,
    fileId2: video.fileId2,
    participant1VideoPath: `/api/video?fileId=${encodeURIComponent(video.fileId1)}&label=${encodeURIComponent(video.label)}&split=${encodeURIComponent(video.split)}`,
    participant2VideoPath: `/api/video?fileId=${encodeURIComponent(video.fileId2)}&label=${encodeURIComponent(video.label)}&split=${encodeURIComponent(video.split)}`,
  }));

  const annotatedVideoIds = new Set(annotations.map((a) => a.videoId));

  return (
    <div className="container mx-auto px-4 py-8">
      <VideoList
        interactions={interactions}
        annotatedVideoIds={annotatedVideoIds}
      />
    </div>
  );
}
