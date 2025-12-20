import fs from 'fs';
import path from 'path';

// Path to the seamless_interaction dataset
const DATASET_PATH = path.join(process.env.HOME || '', 'personal', 'seamless_interaction');
// Path to downloaded videos
const DOWNLOADS_PATH = path.join(process.cwd(), 'downloads');

export interface VideoMetadata {
  vendorId: number;
  sessionId: number;
  interactionId: number;
  participant1Id: string;
  participant2Id: string;
  videoId: string; // V{vendor}_S{session}_I{interaction}
  participant1VideoPath: string;
  participant2VideoPath: string;
  metadataPath?: string;
  metadata?: any;
}

/**
 * Parse file ID from filename using pattern: V{vendor}_S{session}_I{interaction}_P{participant}
 * Participant ID can be numeric or alphanumeric (e.g., 0799, 0299A)
 */
export function parseFileId(filename: string): {
  vendorId: number;
  sessionId: number;
  interactionId: number;
  participantId: string;
} | null {
  const match = filename.match(/V(\d+)_S(\d+)_I(\d+)_P([0-9A-Za-z]+)/);
  if (!match) return null;

  return {
    vendorId: parseInt(match[1]),
    sessionId: parseInt(match[2]),
    interactionId: parseInt(match[3]),
    participantId: match[4], // Keep as string to handle alphanumeric IDs
  };
}

/**
 * Get all available videos from the dataset
 * Scans for .mp4 files and groups them by interaction
 */
export async function getAvailableVideos(): Promise<VideoMetadata[]> {
  const videos: Map<string, VideoMetadata> = new Map();

  try {
    // Check both dataset path and downloads path
    const pathsToScan = [DATASET_PATH, DOWNLOADS_PATH].filter(p => fs.existsSync(p));

    if (pathsToScan.length === 0) {
      console.warn(`No video paths found. Checked: ${DATASET_PATH}, ${DOWNLOADS_PATH}`);
      return [];
    }

    // Recursively find all .mp4 files
    const findVideos = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip .venv and .git directories
          if (entry.name === '.venv' || entry.name === '.git' || entry.name === 'node_modules') {
            continue;
          }
          findVideos(fullPath);
        } else if (entry.name.endsWith('.mp4')) {
          const parsed = parseFileId(entry.name);
          if (!parsed) continue;

          const { vendorId, sessionId, interactionId, participantId } = parsed;

          // Extract videoId from filename to preserve leading zeros
          const videoIdMatch = entry.name.match(/(V\d+_S\d+_I\d+)_P/);
          const videoId = videoIdMatch ? videoIdMatch[1] : `V${vendorId}_S${sessionId}_I${interactionId}`;

          if (!videos.has(videoId)) {
            videos.set(videoId, {
              vendorId,
              sessionId,
              interactionId,
              participant1Id: '',
              participant2Id: '',
              videoId,
              participant1VideoPath: '',
              participant2VideoPath: '',
            });
          }

          const video = videos.get(videoId)!;

          // Assign to participant 1 or 2 based on order found
          if (!video.participant1VideoPath) {
            video.participant1Id = participantId;
            video.participant1VideoPath = fullPath;
          } else if (!video.participant2VideoPath) {
            video.participant2Id = participantId;
            video.participant2VideoPath = fullPath;
          }

          // Look for metadata JSON file
          const metadataPath = fullPath.replace('.mp4', '_metadata.json');
          if (fs.existsSync(metadataPath)) {
            video.metadataPath = metadataPath;
            try {
              video.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            } catch (e) {
              console.error(`Failed to parse metadata: ${metadataPath}`, e);
            }
          }
        }
      }
    };

    // Scan all available paths
    pathsToScan.forEach(p => findVideos(p));

    // Filter out videos that don't have both participants
    const completeVideos = Array.from(videos.values()).filter(
      (v) => v.participant1VideoPath && v.participant2VideoPath
    );

    return completeVideos;
  } catch (error) {
    console.error('Error scanning dataset:', error);
    return [];
  }
}

/**
 * Get video metadata by video ID
 */
export async function getVideoById(videoId: string): Promise<VideoMetadata | null> {
  const videos = await getAvailableVideos();
  return videos.find((v) => v.videoId === videoId) || null;
}

/**
 * Calculate dataset statistics
 */
export async function getDatasetStats() {
  const videos = await getAvailableVideos();

  return {
    totalVideos: videos.length,
    totalSpeakers: videos.length * 2,
    uniqueVendors: new Set(videos.map((v) => v.vendorId)).size,
    uniqueSessions: new Set(videos.map((v) => `${v.vendorId}_${v.sessionId}`)).size,
  };
}
