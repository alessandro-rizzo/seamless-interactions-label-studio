import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "json";

  try {
    const annotations = await prisma.annotation.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "id",
        "videoId",
        "vendorId",
        "sessionId",
        "interactionId",
        "speaker1Id",
        "speaker2Id",
        "speaker1Label",
        "speaker2Label",
        "speaker1Confidence",
        "speaker2Confidence",
        "speaker1Comments",
        "speaker2Comments",
        "labelingTimeMs",
        "createdAt",
        "updatedAt",
      ];

      const csvRows = [
        headers.join(","),
        ...annotations.map((annotation) =>
          [
            annotation.id,
            annotation.videoId,
            annotation.vendorId,
            annotation.sessionId,
            annotation.interactionId,
            annotation.speaker1Id,
            annotation.speaker2Id,
            `"${annotation.speaker1Label}"`,
            `"${annotation.speaker2Label}"`,
            annotation.speaker1Confidence,
            annotation.speaker2Confidence,
            `"${(annotation.speaker1Comments || "").replace(/"/g, '""')}"`,
            `"${(annotation.speaker2Comments || "").replace(/"/g, '""')}"`,
            annotation.labelingTimeMs,
            annotation.createdAt.toISOString(),
            annotation.updatedAt.toISOString(),
          ].join(",")
        ),
      ];

      const csv = csvRows.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="annotations-${new Date()
            .toISOString()
            .split("T")[0]}.csv"`,
        },
      });
    } else {
      // Return JSON
      const json = JSON.stringify(annotations, null, 2);

      return new NextResponse(json, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="annotations-${new Date()
            .toISOString()
            .split("T")[0]}.json"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting annotations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
