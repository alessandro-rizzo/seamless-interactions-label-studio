import { NextResponse } from "next/server";

/**
 * Test endpoint to check HuggingFace URL structure
 */
export async function GET() {
  // Test URL from filelist
  const testFileId = "V00_S0644_I00000129_P0799";
  const label = "improvised";
  const split = "dev";
  const batchIdx = 0;

  const testUrl = `https://huggingface.co/datasets/facebook/seamless-interaction/resolve/main/${label}/${split}/batch_${batchIdx}/${testFileId}.mp4`;

  try {
    const response = await fetch(testUrl, { method: 'HEAD' });

    return NextResponse.json({
      url: testUrl,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      redirected: response.redirected,
      finalUrl: response.url,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      url: testUrl,
    }, { status: 500 });
  }
}
