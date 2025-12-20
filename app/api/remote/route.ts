import { NextResponse } from "next/server";
import { listRemoteInteractions, checkDownloadedInteractions } from "@/lib/dataset-remote";

/**
 * GET /api/remote - List all available interactions from the dataset
 */
export async function GET() {
  try {
    const interactions = await listRemoteInteractions();
    const withDownloadStatus = await checkDownloadedInteractions(interactions);

    return NextResponse.json({
      interactions: withDownloadStatus,
      total: withDownloadStatus.length,
    });
  } catch (error) {
    console.error("Error listing remote interactions:", error);
    return NextResponse.json(
      { error: "Failed to list remote interactions" },
      { status: 500 }
    );
  }
}
