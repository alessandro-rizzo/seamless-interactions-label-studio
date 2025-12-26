import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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
      labelingTimeMs,
    } = body;

    // Validate required fields
    if (!videoId || !speaker1Label || !speaker2Label) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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
        labelingTimeMs,
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
        labelingTimeMs,
      },
    });

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
