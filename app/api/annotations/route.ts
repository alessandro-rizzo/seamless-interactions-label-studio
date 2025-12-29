import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Extrapolate annotation to all unlabeled videos in the same session
 */
async function extrapolateAnnotationsToSession({
  userId,
  vendorId,
  sessionId,
  currentVideoId,
  speaker1Id,
  speaker2Id,
  speaker1Label,
  speaker2Label,
  speaker1Confidence,
  speaker2Confidence,
}: {
  userId: string;
  vendorId: number;
  sessionId: number;
  currentVideoId: string;
  speaker1Id: string;
  speaker2Id: string;
  speaker1Label: string;
  speaker2Label: string;
  speaker1Confidence: number;
  speaker2Confidence: number;
}) {
  // Create a map of speaker ID to their label and confidence
  const speakerLabels = new Map([
    [speaker1Id, { label: speaker1Label, confidence: speaker1Confidence }],
    [speaker2Id, { label: speaker2Label, confidence: speaker2Confidence }],
  ]);
  // 1. Get all videos in the same session
  const sessionVideos = await prisma.video.findMany({
    where: {
      vendorId,
      sessionId,
      videoId: {
        not: currentVideoId, // Exclude current video
      },
    },
  });

  // 2. Get existing annotations for this user in this session
  const existingAnnotations = await prisma.annotation.findMany({
    where: {
      userId,
      videoId: {
        in: sessionVideos.map((v) => v.videoId),
      },
    },
    select: {
      videoId: true,
    },
  });

  const annotatedVideoIds = new Set(existingAnnotations.map((a) => a.videoId));

  // 3. Filter to only unlabeled videos
  const unlabeledVideos = sessionVideos.filter(
    (v) => !annotatedVideoIds.has(v.videoId),
  );

  // 4. Batch create extrapolated annotations
  if (unlabeledVideos.length > 0) {
    await prisma.annotation.createMany({
      data: unlabeledVideos.map((video) => {
        // Map labels by speaker ID, not position
        const video1Data = speakerLabels.get(video.participant1Id);
        const video2Data = speakerLabels.get(video.participant2Id);

        return {
          userId,
          videoId: video.videoId,
          vendorId: video.vendorId,
          sessionId: video.sessionId,
          interactionId: video.interactionId,
          speaker1Id: video.participant1Id,
          speaker2Id: video.participant2Id,
          speaker1Label: video1Data?.label || "Unknown",
          speaker2Label: video2Data?.label || "Unknown",
          speaker1Confidence: video1Data?.confidence || 3,
          speaker2Confidence: video2Data?.confidence || 3,
        // Extrapolated annotations have NO optional fields
        speaker1Comments: "",
        speaker2Comments: "",
        // All category arrays empty
        speaker1Prosody: [],
        speaker1LexicalChoice: [],
        speaker1TurnTaking: [],
        speaker1Gaze: [],
        speaker1FacialExpression: [],
        speaker1Gesture: [],
        speaker1Posture: [],
        speaker1AffectRegulation: [],
        speaker1InteractionalRole: [],
        speaker1TimingLatency: [],
        speaker1RepairBehavior: [],
        speaker2Prosody: [],
        speaker2LexicalChoice: [],
        speaker2TurnTaking: [],
        speaker2Gaze: [],
        speaker2FacialExpression: [],
        speaker2Gesture: [],
        speaker2Posture: [],
        speaker2AffectRegulation: [],
        speaker2InteractionalRole: [],
        speaker2TimingLatency: [],
        speaker2RepairBehavior: [],
          // NO timing for extrapolated
          labelingTimeMs: 0,
          // Mark as extrapolated
          annotationType: "extrapolated",
        };
      }),
      skipDuplicates: true, // Safety measure
    });
  }

  return unlabeledVideos.length;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // FILTER: Only return current user's annotations
    const annotations = await prisma.annotation.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      videoId,
      vendorId,
      sessionId,
      interactionId,
      speaker1Id,
      speaker2Id,
      speaker1Label,
      speaker2Label,
      speaker1Confidence,
      speaker2Confidence,
      speaker1Comments,
      speaker2Comments,
      speaker1Categories,
      speaker2Categories,
      labelingTimeMs,
      extrapolateToSession,
    } = body;

    // Validate required fields
    if (!videoId || !speaker1Label || !speaker2Label) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Determine annotation type based on timing data
    // If has timing (> 0), it's manual; otherwise it's extrapolated
    const isManual = labelingTimeMs > 0;
    const annotationType = isManual ? "manual" : "extrapolated";

    // CHANGED: Upsert using composite key [userId, videoId]
    const annotation = await prisma.annotation.upsert({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
      update: {
        speaker1Label,
        speaker2Label,
        speaker1Confidence,
        speaker2Confidence,
        speaker1Comments,
        speaker2Comments,
        speaker1Prosody: speaker1Categories?.prosody || [],
        speaker1LexicalChoice: speaker1Categories?.lexical_choice || [],
        speaker1TurnTaking: speaker1Categories?.turn_taking || [],
        speaker1Gaze: speaker1Categories?.gaze || [],
        speaker1FacialExpression: speaker1Categories?.facial_expression || [],
        speaker1Gesture: speaker1Categories?.gesture || [],
        speaker1Posture: speaker1Categories?.posture || [],
        speaker1AffectRegulation: speaker1Categories?.affect_regulation || [],
        speaker1InteractionalRole: speaker1Categories?.interactional_role || [],
        speaker1TimingLatency: speaker1Categories?.timing_latency || [],
        speaker1RepairBehavior: speaker1Categories?.repair_behavior || [],
        speaker2Prosody: speaker2Categories?.prosody || [],
        speaker2LexicalChoice: speaker2Categories?.lexical_choice || [],
        speaker2TurnTaking: speaker2Categories?.turn_taking || [],
        speaker2Gaze: speaker2Categories?.gaze || [],
        speaker2FacialExpression: speaker2Categories?.facial_expression || [],
        speaker2Gesture: speaker2Categories?.gesture || [],
        speaker2Posture: speaker2Categories?.posture || [],
        speaker2AffectRegulation: speaker2Categories?.affect_regulation || [],
        speaker2InteractionalRole: speaker2Categories?.interactional_role || [],
        speaker2TimingLatency: speaker2Categories?.timing_latency || [],
        speaker2RepairBehavior: speaker2Categories?.repair_behavior || [],
        labelingTimeMs,
        annotationType,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        videoId,
        vendorId,
        sessionId,
        interactionId,
        speaker1Id,
        speaker2Id,
        speaker1Label,
        speaker2Label,
        speaker1Confidence,
        speaker2Confidence,
        speaker1Comments,
        speaker2Comments,
        speaker1Prosody: speaker1Categories?.prosody || [],
        speaker1LexicalChoice: speaker1Categories?.lexical_choice || [],
        speaker1TurnTaking: speaker1Categories?.turn_taking || [],
        speaker1Gaze: speaker1Categories?.gaze || [],
        speaker1FacialExpression: speaker1Categories?.facial_expression || [],
        speaker1Gesture: speaker1Categories?.gesture || [],
        speaker1Posture: speaker1Categories?.posture || [],
        speaker1AffectRegulation: speaker1Categories?.affect_regulation || [],
        speaker1InteractionalRole: speaker1Categories?.interactional_role || [],
        speaker1TimingLatency: speaker1Categories?.timing_latency || [],
        speaker1RepairBehavior: speaker1Categories?.repair_behavior || [],
        speaker2Prosody: speaker2Categories?.prosody || [],
        speaker2LexicalChoice: speaker2Categories?.lexical_choice || [],
        speaker2TurnTaking: speaker2Categories?.turn_taking || [],
        speaker2Gaze: speaker2Categories?.gaze || [],
        speaker2FacialExpression: speaker2Categories?.facial_expression || [],
        speaker2Gesture: speaker2Categories?.gesture || [],
        speaker2Posture: speaker2Categories?.posture || [],
        speaker2AffectRegulation: speaker2Categories?.affect_regulation || [],
        speaker2InteractionalRole: speaker2Categories?.interactional_role || [],
        speaker2TimingLatency: speaker2Categories?.timing_latency || [],
        speaker2RepairBehavior: speaker2Categories?.repair_behavior || [],
        labelingTimeMs,
        annotationType,
      },
    });

    // Handle session-wide extrapolation if requested and annotation is manual
    if (extrapolateToSession && isManual) {
      await extrapolateAnnotationsToSession({
        userId: session.user.id,
        vendorId,
        sessionId,
        currentVideoId: videoId,
        speaker1Id,
        speaker2Id,
        speaker1Label,
        speaker2Label,
        speaker1Confidence,
        speaker2Confidence,
      });
    }

    return NextResponse.json(annotation);
  } catch (error) {
    console.error("Error saving annotation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const videoId = searchParams.get("videoId");

    if (!id && !videoId) {
      return NextResponse.json(
        { error: "Missing annotation ID or videoId" },
        { status: 400 },
      );
    }

    if (videoId) {
      // CHANGED: Delete by composite key [userId, videoId]
      // This ensures users can only delete their own annotations
      await prisma.annotation.delete({
        where: {
          userId_videoId: {
            userId: session.user.id,
            videoId,
          },
        },
      });
    } else if (id) {
      // SECURITY: Verify ownership before deleting by ID
      const annotation = await prisma.annotation.findUnique({
        where: { id },
      });

      if (!annotation || annotation.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Annotation not found or unauthorized" },
          { status: 404 },
        );
      }

      await prisma.annotation.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting annotation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
