import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAvailableVideos } from "@/lib/dataset";
import { listRemoteInteractions } from "@/lib/dataset-remote";
import { formatTime, formatNumber } from "@/lib/utils";
import { Download } from "lucide-react";

export default async function Home() {
  const [videos, allRemoteVideos, annotations] = await Promise.all([
    getAvailableVideos(),
    listRemoteInteractions(),
    prisma.annotation.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalVideosInDataset = allRemoteVideos.length;
  const downloadedVideos = videos.length;
  const annotatedVideos = annotations.length;
  const totalSpeakers = annotatedVideos * 2;

  // Calculate morph distribution (A/B proportions)
  const morphACount = annotations.reduce((sum, a) => {
    return sum + (a.speaker1Label === "Morph A" ? 1 : 0) + (a.speaker2Label === "Morph A" ? 1 : 0);
  }, 0);
  const morphBCount = annotations.reduce((sum, a) => {
    return sum + (a.speaker1Label === "Morph B" ? 1 : 0) + (a.speaker2Label === "Morph B" ? 1 : 0);
  }, 0);
  const morphAPercentage = totalSpeakers > 0 ? (morphACount / totalSpeakers) * 100 : 0;
  const morphBPercentage = totalSpeakers > 0 ? (morphBCount / totalSpeakers) * 100 : 0;

  // Calculate average confidence (per speaker)
  const avgSpeaker1Confidence =
    annotations.length > 0
      ? annotations.reduce((sum, a) => sum + a.speaker1Confidence, 0) / annotations.length
      : 0;
  const avgSpeaker2Confidence =
    annotations.length > 0
      ? annotations.reduce((sum, a) => sum + a.speaker2Confidence, 0) / annotations.length
      : 0;
  const avgOverallConfidence = annotations.length > 0
    ? (avgSpeaker1Confidence + avgSpeaker2Confidence) / 2
    : 0;

  // Calculate total labeling time
  const totalLabelingTime = annotations.reduce((sum, a) => sum + a.labelingTimeMs, 0);

  // Calculate average time per video
  const avgTimePerVideo = annotatedVideos > 0 ? totalLabelingTime / annotatedVideos : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/videos"
          className="flex-1 p-8 border-2 rounded-lg bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
        >
          <h2 className="text-2xl font-semibold mb-2">📹 Start Labeling</h2>
          <p className="text-muted-foreground">
            Browse and label video interactions with speaker morphs
          </p>
        </Link>
        <div className="flex flex-col gap-3">
          <Link
            href="/api/export?format=json"
            className="flex items-center gap-2 px-6 py-4 border-2 rounded-lg bg-card hover:bg-accent transition-colors"
          >
            <Download size={20} />
            <span className="font-semibold">Export JSON</span>
          </Link>
          <Link
            href="/api/export?format=csv"
            className="flex items-center gap-2 px-6 py-4 border-2 rounded-lg bg-card hover:bg-accent transition-colors"
          >
            <Download size={20} />
            <span className="font-semibold">Export CSV</span>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Videos</h3>
          <p className="text-3xl font-bold mt-2">{formatNumber(downloadedVideos)}</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Annotated Videos</h3>
          <p className="text-3xl font-bold mt-2">{formatNumber(annotatedVideos)}</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Labeled Speakers</h3>
          <p className="text-3xl font-bold mt-2">{formatNumber(totalSpeakers)}</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Avg Confidence</h3>
          <p className="text-3xl font-bold mt-2">{avgOverallConfidence.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Speaker 1: {avgSpeaker1Confidence.toFixed(1)} • Speaker 2: {avgSpeaker2Confidence.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Time Stats */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Total Labeling Time</h3>
          <p className="text-3xl font-bold mt-2">{formatTime(totalLabelingTime)}</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h3 className="text-sm font-medium text-muted-foreground">Avg Time per Video</h3>
          <p className="text-3xl font-bold mt-2">{formatTime(avgTimePerVideo)}</p>
        </div>
      </div>

      {/* Morph Distribution */}
      <div className="p-6 border rounded-lg bg-card mb-8">
        <h3 className="text-lg font-semibold mb-4">Morph Distribution (A/B Proportions)</h3>
        {totalSpeakers > 0 ? (
          <div className="space-y-4">
            {/* Morph A */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-lg">Morph A</span>
                <span className="text-lg font-semibold">
                  {morphACount} / {totalSpeakers} ({morphAPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all"
                  style={{ width: `${morphAPercentage}%` }}
                />
              </div>
            </div>

            {/* Morph B */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-lg">Morph B</span>
                <span className="text-lg font-semibold">
                  {morphBCount} / {totalSpeakers} ({morphBPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${morphBPercentage}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No annotations yet</p>
        )}
      </div>

      {/* Recent Annotations */}
      <div className="p-6 border rounded-lg bg-card">
        <h3 className="text-lg font-semibold mb-4">Recent Annotations</h3>
        {annotations.length > 0 ? (
          <div className="space-y-3">
            {annotations.slice(0, 10).map((annotation) => (
              <Link
                key={annotation.id}
                href={`/videos/${annotation.videoId}`}
                className="block p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{annotation.videoId}</p>
                    <p className="text-sm text-muted-foreground">
                      Speaker {annotation.speaker1Id}: {annotation.speaker1Label} (confidence: {annotation.speaker1Confidence}) • Speaker{" "}
                      {annotation.speaker2Id}: {annotation.speaker2Label} (confidence: {annotation.speaker2Confidence})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Time: {formatTime(annotation.labelingTimeMs)}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(annotation.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No annotations yet. Start labeling videos to see your progress here!</p>
        )}
      </div>
    </div>
  );
}
