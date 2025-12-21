import { prisma } from "@/lib/db";
import { VideoList } from "@/components/video-list";
import { listRemoteInteractions, checkDownloadedInteractions } from "@/lib/dataset-remote";

// Force dynamic rendering - page is too large to pre-render (64,000+ videos)
export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const [interactions, annotations] = await Promise.all([
    listRemoteInteractions().then(checkDownloadedInteractions),
    prisma.annotation.findMany({
      select: { videoId: true },
    }),
  ]);

  const annotatedVideoIds = new Set(annotations.map((a) => a.videoId));

  return (
    <div className="container mx-auto px-4 py-8">
      <VideoList interactions={interactions} annotatedVideoIds={annotatedVideoIds} />
    </div>
  );
}
