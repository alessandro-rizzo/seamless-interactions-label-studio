/**
 * API endpoint to refresh video metadata from filelist.csv
 * GET /api/videos/refresh - Refresh all video data
 * POST /api/videos/refresh - Force refresh (ignores cache)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

interface FilelistEntry {
  file_id: string;
  label: string;
  split: string;
  batch_idx: string;
  archive_idx: string;
}

function parseFileId(fileId: string) {
  const match = fileId.match(/V(\d+)_S(\d+)_I(\d+)_P(.+)/);
  if (!match) return null;

  return {
    vendorId: parseInt(match[1]),
    sessionId: parseInt(match[2]),
    interactionId: parseInt(match[3]),
    participantId: match[4],
    videoId: `V${match[1]}_S${match[2]}_I${match[3]}`,
  };
}

async function loadFilelist(forceRefresh = false): Promise<FilelistEntry[]> {
  const cacheDir = path.join(process.cwd(), '.cache');
  const cacheFile = path.join(cacheDir, 'filelist.csv');
  const GITHUB_URL = 'https://raw.githubusercontent.com/facebookresearch/seamless_interaction/main/assets/filelist.csv';

  // Check cache (unless force refresh)
  if (!forceRefresh && fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    const age = Date.now() - stats.mtimeMs;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age < maxAge) {
      const content = fs.readFileSync(cacheFile, 'utf-8');
      return parseCSV(content);
    }
  }

  // Download from GitHub
  const response = await fetch(GITHUB_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch filelist: ${response.statusText}`);
  }

  const content = await response.text();

  // Cache the file
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(cacheFile, content, 'utf-8');

  return parseCSV(content);
}

function parseCSV(content: string): FilelistEntry[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index];
    });
    return entry as FilelistEntry;
  });
}

export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get('force') === 'true';

    const startTime = Date.now();

    // Load filelist
    const filelist = await loadFilelist(forceRefresh);

    // Group by interaction
    const interactionMap = new Map();

    for (const entry of filelist) {
      const parsed = parseFileId(entry.file_id);
      if (!parsed) continue;

      const { videoId, vendorId, sessionId, interactionId, participantId } = parsed;

      if (!interactionMap.has(videoId)) {
        interactionMap.set(videoId, {
          videoId,
          vendorId,
          sessionId,
          interactionId,
          participant1Id: participantId,
          participant2Id: '',
          label: entry.label,
          split: entry.split,
          fileId1: entry.file_id,
          fileId2: '',
          batchIdx: parseInt(entry.batch_idx),
          archiveIdx: parseInt(entry.archive_idx),
        });
      } else {
        const interaction = interactionMap.get(videoId)!;
        interaction.participant2Id = participantId;
        interaction.fileId2 = entry.file_id;
      }
    }

    // Filter complete interactions
    const completeInteractions = Array.from(interactionMap.values()).filter(
      (i: any) => i.fileId1 && i.fileId2
    );

    // Check downloaded files
    const downloadDir = path.join(process.cwd(), 'downloads');
    const downloadedFiles = new Set<string>();

    if (fs.existsSync(downloadDir)) {
      const files = fs.readdirSync(downloadDir);
      for (const file of files) {
        if (file.endsWith('.mp4')) {
          downloadedFiles.add(file);
        }
      }
    }

    // Batch upsert
    const batchSize = 500;
    let imported = 0;
    let updated = 0;

    for (let i = 0; i < completeInteractions.length; i += batchSize) {
      const batch = completeInteractions.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (interaction: any) => {
          const p1File = `${interaction.fileId1}.mp4`;
          const p2File = `${interaction.fileId2}.mp4`;
          const isDownloaded = downloadedFiles.has(p1File) && downloadedFiles.has(p2File);

          const data = {
            videoId: interaction.videoId,
            vendorId: interaction.vendorId,
            sessionId: interaction.sessionId,
            interactionId: interaction.interactionId,
            participant1Id: interaction.participant1Id,
            participant2Id: interaction.participant2Id,
            label: interaction.label,
            split: interaction.split,
            fileId1: interaction.fileId1,
            fileId2: interaction.fileId2,
            batchIdx: interaction.batchIdx,
            archiveIdx: interaction.archiveIdx,
            isDownloaded,
            participant1Path: isDownloaded ? path.join(downloadDir, p1File) : null,
            participant2Path: isDownloaded ? path.join(downloadDir, p2File) : null,
          };

          const existing = await prisma.video.findUnique({
            where: { videoId: interaction.videoId },
          });

          await prisma.video.upsert({
            where: { videoId: interaction.videoId },
            update: data,
            create: data,
          });

          if (existing) {
            updated++;
          } else {
            imported++;
          }
        })
      );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      stats: {
        totalInteractions: completeInteractions.length,
        imported,
        updated,
        downloaded: completeInteractions.filter((i: any) => {
          const p1File = `${i.fileId1}.mp4`;
          const p2File = `${i.fileId2}.mp4`;
          return downloadedFiles.has(p1File) && downloadedFiles.has(p2File);
        }).length,
      },
      duration: `${(duration / 1000).toFixed(2)}s`,
    });
  } catch (error: any) {
    console.error('Error refreshing videos:', error);
    return NextResponse.json(
      { error: 'Failed to refresh video data', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Force refresh by setting force=true
  const url = new URL(request.url);
  url.searchParams.set('force', 'true');

  return GET(
    new NextRequest(url, {
      method: 'GET',
    })
  );
}
