/**
 * Remote dataset access via HuggingFace filelist
 * Lists all available videos without requiring local download
 */

import fs from 'fs';
import path from 'path';

export interface RemoteVideoInfo {
  videoId: string;
  vendorId: number;
  sessionId: number;
  interactionId: number;
  participantId: number;
  label: string; // 'improvised' or 'naturalistic'
  split: string; // 'train', 'dev', or 'test'
  fileId: string; // Full file ID like V00_S0001_I00000001_P0
  batchIdx: number;
  archiveIdx: number;
  isDownloaded: boolean;
  localPath?: string;
}

export interface InteractionInfo {
  videoId: string;
  vendorId: number;
  sessionId: number;
  interactionId: number;
  participant1Id: string;
  participant2Id: string;
  label: string;
  split: string;
  fileId1: string;
  fileId2: string;
  batchIdx: number;
  archiveIdx: number;
  isDownloaded: boolean;
  participant1Path?: string;
  participant2Path?: string;
}

/**
 * Parse file ID to extract components
 */
function parseFileId(fileId: string): {
  vendorId: number;
  sessionId: number;
  interactionId: number;
  participantId: string;
  videoId: string;
} | null {
  // V00_S0644_I00000129_P0799
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

/**
 * Load filelist.csv from GitHub or local cache
 * This contains all available videos in the dataset
 */
async function loadFilelist(): Promise<any[]> {
  const cacheDir = path.join(process.cwd(), '.cache');
  const cacheFile = path.join(cacheDir, 'filelist.csv');
  const GITHUB_URL = 'https://raw.githubusercontent.com/facebookresearch/seamless_interaction/main/assets/filelist.csv';

  // Check if we have a cached version (less than 24 hours old)
  if (fs.existsSync(cacheFile)) {
    const stats = fs.statSync(cacheFile);
    const age = Date.now() - stats.mtimeMs;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (age < maxAge) {
      console.log('Using cached filelist.csv');
      const content = fs.readFileSync(cacheFile, 'utf-8');
      return parseCSV(content);
    }
  }

  // Download from GitHub
  try {
    console.log('Downloading filelist.csv from GitHub...');
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
    console.log('Filelist cached successfully');

    return parseCSV(content);
  } catch (error) {
    console.error('Failed to download filelist from GitHub:', error);

    // Try local fallback
    const localPath = path.join(
      process.env.HOME || '',
      'personal',
      'seamless_interaction',
      'assets',
      'filelist.csv'
    );

    if (fs.existsSync(localPath)) {
      console.log('Using local fallback filelist');
      const content = fs.readFileSync(localPath, 'utf-8');
      return parseCSV(content);
    }

    console.error('No filelist available (GitHub failed and no local copy)');
    return [];
  }
}

/**
 * Parse CSV content into array of objects
 */
function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const entry: any = {};
    headers.forEach((header, index) => {
      entry[header] = values[index];
    });
    return entry;
  });
}

/**
 * Get list of all interactions from the dataset manifest
 */
export async function listRemoteInteractions(): Promise<InteractionInfo[]> {
  const filelist = await loadFilelist();

  if (filelist.length === 0) {
    return [];
  }

  // Group by interaction (videoId)
  const interactionMap = new Map<string, InteractionInfo>();

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
        isDownloaded: false,
      });
    } else {
      const interaction = interactionMap.get(videoId)!;
      interaction.participant2Id = participantId;
      interaction.fileId2 = entry.file_id;
    }
  }

  // Filter to only complete interactions (with both participants)
  return Array.from(interactionMap.values()).filter(
    i => i.fileId1 && i.fileId2
  );
}

/**
 * Check which interactions are already downloaded
 */
export async function checkDownloadedInteractions(interactions: InteractionInfo[]): Promise<InteractionInfo[]> {
  const downloadDir = path.join(process.cwd(), 'downloads');

  if (!fs.existsSync(downloadDir)) {
    return interactions;
  }

  return interactions.map(interaction => {
    const p1Path = path.join(downloadDir, `${interaction.fileId1}.mp4`);
    const p2Path = path.join(downloadDir, `${interaction.fileId2}.mp4`);

    const isDownloaded = fs.existsSync(p1Path) && fs.existsSync(p2Path);

    return {
      ...interaction,
      isDownloaded,
      participant1Path: isDownloaded ? p1Path : undefined,
      participant2Path: isDownloaded ? p2Path : undefined,
    };
  });
}
