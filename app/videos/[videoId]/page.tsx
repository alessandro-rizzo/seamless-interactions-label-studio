import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVideoById } from "@/lib/dataset";
import { LabelingForm } from "@/components/labeling-form";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default async function VideoLabelingPage({ params }: PageProps) {
  const { videoId } = await params;
  const video = await getVideoById(videoId);

  if (!video) {
    notFound();
  }

  // Check if annotation already exists
  const existingAnnotation = await prisma.annotation.findUnique({
    where: { videoId },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{videoId}</h1>
        <p className="text-muted-foreground mt-1">
          Vendor {video.vendorId} • Session {video.sessionId} • Interaction {video.interactionId}
        </p>
      </div>

      <LabelingForm video={video} existingAnnotation={existingAnnotation} />
    </div>
  );
}
