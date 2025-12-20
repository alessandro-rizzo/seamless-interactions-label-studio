/**
 * Video download management using HuggingFace Hub API directly
 * No Python required!
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads');
// S3 bucket configuration (from Python toolkit)
const S3_BUCKET = 'dl.fbaipublicfiles.com';
const S3_PREFIX = 'seamless_interaction';
const S3_BASE_URL = `https://${S3_BUCKET}/${S3_PREFIX}`;

/**
 * Ensure downloads directory exists
 */
export function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
  return DOWNLOAD_DIR;
}

/**
 * Download a single video file from HuggingFace using streams
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath); // Delete partial file
        reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(destPath); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath); // Delete partial file
      reject(err);
    });
  });
}

/**
 * Download a single interaction (both participants) from S3
 * Uses direct S3 bucket access (same as Python toolkit)
 */
export async function downloadInteraction(
  fileId1: string,
  fileId2: string,
  label: string = 'improvised',
  split: string = 'dev',
  batchIdx: number = 0 // Not used for S3, but kept for API compatibility
): Promise<{
  success: boolean;
  error?: string;
  participant1Path?: string;
  participant2Path?: string;
}> {
  try {
    ensureDownloadDir();

    // Construct S3 URLs (direct access to individual video files)
    // Format: {base_url}/{label}/{split}/video/{fileId}.mp4
    const url1 = `${S3_BASE_URL}/${label}/${split}/video/${fileId1}.mp4`;
    const url2 = `${S3_BASE_URL}/${label}/${split}/video/${fileId2}.mp4`;

    const p1Path = path.join(DOWNLOAD_DIR, `${fileId1}.mp4`);
    const p2Path = path.join(DOWNLOAD_DIR, `${fileId2}.mp4`);

    console.log(`Downloading: ${url1}`);
    console.log(`Downloading: ${url2}`);

    // Download both videos
    await Promise.all([
      downloadFile(url1, p1Path),
      downloadFile(url2, p2Path),
    ]);

    console.log(`✓ Downloaded: ${fileId1}.mp4 and ${fileId2}.mp4`);

    return {
      success: true,
      participant1Path: p1Path,
      participant2Path: p2Path,
    };
  } catch (error: any) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete downloaded videos for an interaction
 */
export async function deleteInteraction(fileId1: string, fileId2: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const p1Path = path.join(DOWNLOAD_DIR, `${fileId1}.mp4`);
    const p2Path = path.join(DOWNLOAD_DIR, `${fileId2}.mp4`);

    if (fs.existsSync(p1Path)) {
      fs.unlinkSync(p1Path);
    }

    if (fs.existsSync(p2Path)) {
      fs.unlinkSync(p2Path);
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get download statistics
 */
export function getDownloadStats(): {
  downloadedCount: number;
  totalSize: number;
  downloadDir: string;
} {
  ensureDownloadDir();

  const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => f.endsWith('.mp4'));
  const totalSize = files.reduce((sum, file) => {
    const stat = fs.statSync(path.join(DOWNLOAD_DIR, file));
    return sum + stat.size;
  }, 0);

  return {
    downloadedCount: files.length,
    totalSize,
    downloadDir: DOWNLOAD_DIR,
  };
}
