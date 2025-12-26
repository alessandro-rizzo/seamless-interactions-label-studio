import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const annotatedFilter = searchParams.get("annotatedFilter") || "all";
    const labelFilter = searchParams.get("labelFilter") || "all";
    const sortBy = searchParams.get("sortBy") || "videoId";

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Search filter
    if (search) {
      where.videoId = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Label filter
    if (labelFilter !== "all") {
      where.label = labelFilter;
    }

    // For annotated filter, we need to handle it differently
    let videoIds: string[] | undefined;
    if (annotatedFilter === "annotated") {
      // Get all annotated video IDs
      const annotated = await prisma.annotation.findMany({
        select: { videoId: true },
        distinct: ["videoId"],
      });
      videoIds = annotated.map((a) => a.videoId);
      where.videoId = videoIds.length > 0 ? { in: videoIds } : undefined;
    } else if (annotatedFilter === "not-annotated") {
      // Get all annotated video IDs
      const annotated = await prisma.annotation.findMany({
        select: { videoId: true },
        distinct: ["videoId"],
      });
      videoIds = annotated.map((a) => a.videoId);
      where.videoId = videoIds.length > 0 ? { notIn: videoIds } : undefined;
    }

    // Build order by clause
    let orderBy: any;
    if (sortBy === "annotatedAt") {
      // For sorting by annotation date, we'll need to join with annotations
      // For now, we'll fetch all annotations and sort client-side
      orderBy = [
        { vendorId: "asc" },
        { sessionId: "asc" },
        { interactionId: "asc" },
      ];
    } else {
      orderBy = [
        { vendorId: "asc" },
        { sessionId: "asc" },
        { interactionId: "asc" },
      ];
    }

    // Get total count and videos in parallel
    const [total, videos, allAnnotations, annotations] = await Promise.all([
      prisma.video.count({ where }),
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      // Get all annotated video IDs for the badge display
      prisma.annotation.findMany({
        select: { videoId: true },
        distinct: ["videoId"],
      }),
      // Get all annotations for stats and sorting
      prisma.annotation.findMany({
        select: {
          videoId: true,
          speaker1Label: true,
          speaker2Label: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Get filter counts for the UI
    const [totalCount, annotatedCount, improvisedCount, naturalisticCount] =
      await Promise.all([
        prisma.video.count(),
        prisma.annotation.findMany({
          select: { videoId: true },
          distinct: ["videoId"],
        }),
        prisma.video.count({ where: { label: "improvised" } }),
        prisma.video.count({ where: { label: "naturalistic" } }),
      ]);

    const annotatedVideoIds = new Set(allAnnotations.map((a) => a.videoId));

    // Create annotation date map for sorting
    const annotationDateMap = new Map(
      annotations.map((a) => [a.videoId, a.createdAt]),
    );

    // Convert to VideoMetadata format
    let interactions = videos.map((video) => ({
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
      annotatedAt: annotationDateMap.get(video.videoId) || null,
    }));

    // Sort by annotation date if requested
    if (sortBy === "annotatedAt") {
      interactions = interactions.sort((a, b) => {
        // Annotated videos first, sorted by date (newest first)
        if (a.annotatedAt && b.annotatedAt) {
          return b.annotatedAt.getTime() - a.annotatedAt.getTime();
        }
        if (a.annotatedAt) return -1;
        if (b.annotatedAt) return 1;
        return 0;
      });
    }

    // Calculate morph distribution stats
    const totalSpeakers = annotations.length * 2;
    const morphACount = annotations.reduce((sum, a) => {
      return (
        sum +
        (a.speaker1Label === "Morph A" ? 1 : 0) +
        (a.speaker2Label === "Morph A" ? 1 : 0)
      );
    }, 0);
    const morphBCount = annotations.reduce((sum, a) => {
      return (
        sum +
        (a.speaker1Label === "Morph B" ? 1 : 0) +
        (a.speaker2Label === "Morph B" ? 1 : 0)
      );
    }, 0);
    const morphAPercentage =
      totalSpeakers > 0 ? (morphACount / totalSpeakers) * 100 : 0;
    const morphBPercentage =
      totalSpeakers > 0 ? (morphBCount / totalSpeakers) * 100 : 0;

    return NextResponse.json({
      interactions,
      annotatedVideoIds: Array.from(annotatedVideoIds),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filterCounts: {
        total: totalCount,
        annotated: annotatedCount.length,
        notAnnotated: totalCount - annotatedCount.length,
        improvised: improvisedCount,
        naturalistic: naturalisticCount,
      },
      stats: {
        morphACount,
        morphBCount,
        morphAPercentage,
        morphBPercentage,
      },
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}
