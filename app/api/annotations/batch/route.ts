import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Batch operations endpoint for annotations
 * Currently supports batch delete operation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, videoIds } = body;

    // Validate request parameters
    if (action !== "delete") {
      return NextResponse.json(
        { error: "Invalid action. Only 'delete' is supported." },
        { status: 400 },
      );
    }

    if (!Array.isArray(videoIds)) {
      return NextResponse.json(
        { error: "videoIds must be an array" },
        { status: 400 },
      );
    }

    if (videoIds.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
      });
    }

    // Batch delete all annotations for the given videoIds
    // The userId filter ensures users can only delete their own annotations
    const result = await prisma.annotation.deleteMany({
      where: {
        userId: session.user.id,
        videoId: {
          in: videoIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error in batch operation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
