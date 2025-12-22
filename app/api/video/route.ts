import { NextRequest, NextResponse } from "next/server";

const S3_BUCKET = "dl.fbaipublicfiles.com";
const S3_PREFIX = "seamless_interaction";
const S3_BASE_URL = `https://${S3_BUCKET}/${S3_PREFIX}`;

/**
 * Stream videos directly from S3 (serverless-friendly, no disk storage)
 * Supports range requests for video seeking
 *
 * Query params:
 * - fileId: The file ID (e.g., "V00_S0644_I00000129_P0799")
 * - label: The label (e.g., "improvised" or "naturalistic")
 * - split: The split (e.g., "dev", "train", "test")
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get("fileId");
  const label = searchParams.get("label") || "improvised";
  const split = searchParams.get("split") || "dev";

  if (!fileId) {
    return NextResponse.json(
      { error: "Missing fileId parameter" },
      { status: 400 },
    );
  }

  try {
    // Construct S3 URL
    const videoUrl = `${S3_BASE_URL}/${label}/${split}/video/${fileId}.mp4`;

    // Get range header from client
    const rangeHeader = request.headers.get("range");

    // Prepare headers for S3 request
    const s3Headers: HeadersInit = {};
    if (rangeHeader) {
      s3Headers["Range"] = rangeHeader;
    }

    // Fetch from S3
    const s3Response = await fetch(videoUrl, {
      headers: s3Headers,
      // Don't follow redirects automatically - handle them explicitly
      redirect: "follow",
    });

    if (!s3Response.ok) {
      console.error(
        `Failed to fetch video from S3: ${s3Response.status} ${s3Response.statusText}`,
      );
      return NextResponse.json(
        { error: `Video not found: ${s3Response.statusText}` },
        { status: s3Response.status },
      );
    }

    // Prepare response headers
    const responseHeaders: HeadersInit = {
      "Content-Type": s3Response.headers.get("Content-Type") || "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    };

    // Copy important headers from S3 response
    const contentLength = s3Response.headers.get("Content-Length");
    const contentRange = s3Response.headers.get("Content-Range");

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    // Return the appropriate status code (206 for partial content, 200 for full)
    const status = s3Response.status;

    return new NextResponse(s3Response.body, {
      status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error streaming video:", error);
    return NextResponse.json(
      { error: "Failed to stream video" },
      { status: 500 },
    );
  }
}
