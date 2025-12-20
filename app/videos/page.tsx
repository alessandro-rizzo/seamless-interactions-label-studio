import { prisma } from "@/lib/db";
import { VideoList } from "@/components/video-list";
import { listRemoteInteractions, checkDownloadedInteractions } from "@/lib/dataset-remote";

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Video List</h1>
        <p className="text-muted-foreground mt-2">
          {annotatedVideoIds.size} of {interactions.length} videos annotated •{" "}
          {interactions.filter(i => i.isDownloaded).length} downloaded
        </p>
      </div>

      <VideoList interactions={interactions} annotatedVideoIds={annotatedVideoIds} />
    </div>
  );
}
