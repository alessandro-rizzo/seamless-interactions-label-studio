import { NextRequest, NextResponse } from "next/server";
import { downloadInteraction, deleteInteraction, getDownloadStats } from "@/lib/download";

/**
 * POST /api/download - Download an interaction
 * Body: { fileId1, fileId2 }
 */
export async function POST(request: NextRequest) {
  try {
    const { fileId1, fileId2, label, split, batchIdx } = await request.json();

    if (!fileId1 || !fileId2) {
      return NextResponse.json(
        { error: "Missing fileId1 or fileId2" },
        { status: 400 }
      );
    }

    const result = await downloadInteraction(fileId1, fileId2, label, split, batchIdx);

    if (result.success) {
      return NextResponse.json({
        success: true,
        participant1Path: result.participant1Path,
        participant2Path: result.participant2Path,
      });
    } else {
      return NextResponse.json(
        { error: result.error || "Download failed" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error downloading interaction:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/download - Delete downloaded videos
 * Query: ?fileId1=...&fileId2=...
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId1 = searchParams.get("fileId1");
    const fileId2 = searchParams.get("fileId2");

    if (!fileId1 || !fileId2) {
      return NextResponse.json(
        { error: "Missing fileId1 or fileId2" },
        { status: 400 }
      );
    }

    const result = await deleteInteraction(fileId1, fileId2);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || "Delete failed" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error deleting interaction:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/download - Get download statistics
 */
export async function GET() {
  try {
    const stats = getDownloadStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error getting download stats:", error);
    return NextResponse.json(
      { error: "Failed to get download stats" },
      { status: 500 }
    );
  }
}
