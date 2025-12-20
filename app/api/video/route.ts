import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoPath = searchParams.get("path");

  if (!videoPath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  try {
    // Security check: ensure the path is within the expected directories
    const normalizedPath = path.normalize(videoPath);
    const homedir = process.env.HOME || "";
    const datasetPath = path.join(homedir, "personal", "seamless_interaction");
    const downloadsPath = path.join(process.cwd(), "downloads");

    const isValidPath = normalizedPath.startsWith(datasetPath) || normalizedPath.startsWith(downloadsPath);

    if (!isValidPath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const stat = fs.statSync(normalizedPath);
    const fileSize = stat.size;
    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(normalizedPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": "video/mp4",
      };

      return new NextResponse(file as any, { status: 206, headers: head });
    } else {
      const file = fs.createReadStream(normalizedPath);
      const head = {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
      };

      return new NextResponse(file as any, { status: 200, headers: head });
    }
  } catch (error) {
    console.error("Error streaming video:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
