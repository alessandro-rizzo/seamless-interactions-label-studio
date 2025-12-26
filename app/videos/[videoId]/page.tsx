import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getVideoById } from "@/lib/dataset";
import { LabelingForm } from "@/components/labeling-form";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default async function VideoLabelingPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    // Should be caught by middleware, but defensive check
    notFound();
  }

  const { videoId } = await params;
  const video = await getVideoById(videoId);

  if (!video) {
    notFound();
  }

  // CHANGED: Check if annotation exists for THIS USER
  const existingAnnotation = await prisma.annotation.findUnique({
    where: {
      userId_videoId: {
        userId: session.user.id,
        videoId,
      },
    },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-4">
        <LabelingForm video={video} existingAnnotation={existingAnnotation} />
      </div>
    </div>
  );
}
