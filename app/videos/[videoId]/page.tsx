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
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-4">
        <LabelingForm video={video} existingAnnotation={existingAnnotation} />
      </div>
    </div>
  );
}
