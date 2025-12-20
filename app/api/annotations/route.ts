import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const annotations = await prisma.annotation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      comments,
      labelingTimeMs,
    } = body;

    // Validate required fields
    if (!videoId || !speaker1Label || !speaker2Label) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upsert annotation (update if exists, create if not)
    const annotation = await prisma.annotation.upsert({
      where: { videoId },
      update: {
        speaker1Label,
        speaker2Label,
        speaker1Confidence,
        speaker2Confidence,
        comments,
        labelingTimeMs,
        updatedAt: new Date(),
      },
      create: {
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
        comments,
        labelingTimeMs,
      },
    });

    return NextResponse.json(annotation);
  } catch (error) {
    console.error("Error saving annotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const videoId = searchParams.get("videoId");

    if (!id && !videoId) {
      return NextResponse.json({ error: "Missing annotation ID or videoId" }, { status: 400 });
    }

    if (videoId) {
      // Delete by videoId
      await prisma.annotation.delete({
        where: { videoId },
      });
    } else if (id) {
      // Delete by id
      await prisma.annotation.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting annotation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
