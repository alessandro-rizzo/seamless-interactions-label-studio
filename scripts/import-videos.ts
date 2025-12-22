/**
 * Import video metadata from filelist.csv into the database
 * Fetches from GitHub and imports into PostgreSQL
 * Run with: pnpm db:import
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface FilelistEntry {
  file_id: string;
  label: string;
  split: string;
  batch_idx: string;
  archive_idx: string;
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
 * Load filelist.csv from GitHub
 */
async function loadFilelist(): Promise<FilelistEntry[]> {
  const GITHUB_URL =
    "https://raw.githubusercontent.com/facebookresearch/seamless_interaction/main/assets/filelist.csv";

  console.log("⬇️  Fetching filelist.csv from GitHub...");

  try {
    const response = await fetch(GITHUB_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch filelist: ${response.statusText}`);
    }

    const content = await response.text();

    // Parse CSV
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",");

    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const entry: any = {};
      headers.forEach((header, index) => {
        entry[header] = values[index];
      });
      return entry as FilelistEntry;
    });
  } catch (error) {
    console.error("❌ Failed to fetch filelist from GitHub:", error);
    throw error;
  }
}

/**
 * Import videos into database
 */
async function importVideos() {
  console.log("🚀 Starting video import...\n");

  try {
    // Load filelist
    const filelist = await loadFilelist();
    console.log(`📊 Found ${filelist.length} video files\n`);

    // Group by interaction (videoId)
    const interactionMap = new Map<
      string,
      {
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
      }
    >();

    for (const entry of filelist) {
      const parsed = parseFileId(entry.file_id);
      if (!parsed) {
        console.warn(`⚠️  Skipping invalid file ID: ${entry.file_id}`);
        continue;
      }

      const { videoId, vendorId, sessionId, interactionId, participantId } =
        parsed;

      if (!interactionMap.has(videoId)) {
        interactionMap.set(videoId, {
          videoId,
          vendorId,
          sessionId,
          interactionId,
          participant1Id: participantId,
          participant2Id: "",
          label: entry.label,
          split: entry.split,
          fileId1: entry.file_id,
          fileId2: "",
        });
      } else {
        const interaction = interactionMap.get(videoId)!;
        interaction.participant2Id = participantId;
        interaction.fileId2 = entry.file_id;
      }
    }

    // Filter to only complete interactions (with both participants)
    const completeInteractions = Array.from(interactionMap.values()).filter(
      (i) => i.fileId1 && i.fileId2,
    );

    console.log(
      `✅ Found ${completeInteractions.length} complete interactions (with both participants)\n`,
    );

    // Import in batches
    const batchSize = 1000;
    let imported = 0;
    let updated = 0;

    console.log("💾 Importing to database...\n");

    for (let i = 0; i < completeInteractions.length; i += batchSize) {
      const batch = completeInteractions.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (interaction) => {
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
          };

          try {
            await prisma.video.upsert({
              where: { videoId: interaction.videoId },
              update: data,
              create: data,
            });

            if (
              await prisma.video.findUnique({
                where: { videoId: interaction.videoId },
              })
            ) {
              updated++;
            } else {
              imported++;
            }
          } catch (error: any) {
            console.error(
              `❌ Error importing ${interaction.videoId}:`,
              error.message,
            );
          }
        }),
      );

      const progress = Math.min(i + batchSize, completeInteractions.length);
      console.log(
        `   Progress: ${progress}/${completeInteractions.length} (${Math.round((progress / completeInteractions.length) * 100)}%)`,
      );
    }

    console.log("\n✅ Import complete!");
    console.log(`   📊 Total interactions: ${completeInteractions.length}`);
    console.log(`   ✨ New records: ${imported}`);
    console.log(`   🔄 Updated records: ${updated}`);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importVideos();
