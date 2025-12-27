/**
 * Export Annotations Script
 *
 * Exports all annotations with user information and embedded watermarks.
 * This data is confidential and proprietary.
 *
 * Usage:
 *   pnpm tsx scripts/export-annotations.ts json
 *   pnpm tsx scripts/export-annotations.ts csv
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { createObjectCsvStringifier } from "csv-writer";

const prisma = new PrismaClient();

// Watermark configuration
const WATERMARK = {
  copyright: "© 2025 Alessandro Rizzo. All Rights Reserved.",
  license:
    "CONFIDENTIAL AND PROPRIETARY - This data is the exclusive property of Alessandro Rizzo and may not be shared, distributed, or reproduced without explicit written permission.",
  trademark: "SeamlessInteractions™ Annotation Data",
  owner: "Alessandro Rizzo",
  contact: "For licensing inquiries, contact the owner.",
};

interface ExportAnnotation {
  // Annotation fields
  id: string;
  videoId: string;
  vendorId: number;
  sessionId: number;
  interactionId: number;
  speaker1Id: string;
  speaker2Id: string;
  speaker1Label: string;
  speaker2Label: string;
  speaker1Confidence: number;
  speaker2Confidence: number;
  speaker1Comments: string;
  speaker2Comments: string;
  // Category annotations
  speaker1Prosody: string[];
  speaker1LexicalChoice: string[];
  speaker1TurnTaking: string[];
  speaker1Gaze: string[];
  speaker1FacialExpression: string[];
  speaker1Gesture: string[];
  speaker1Posture: string[];
  speaker1AffectRegulation: string[];
  speaker1InteractionalRole: string[];
  speaker1TimingLatency: string[];
  speaker1RepairBehavior: string[];
  speaker2Prosody: string[];
  speaker2LexicalChoice: string[];
  speaker2TurnTaking: string[];
  speaker2Gaze: string[];
  speaker2FacialExpression: string[];
  speaker2Gesture: string[];
  speaker2Posture: string[];
  speaker2AffectRegulation: string[];
  speaker2InteractionalRole: string[];
  speaker2TimingLatency: string[];
  speaker2RepairBehavior: string[];
  labelingTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
  // User fields
  userEmail: string;
  username: string;
}

interface WatermarkedExport {
  watermark: typeof WATERMARK & {
    exportId: string;
    exportDate: string;
    totalRecords: number;
  };
  data: ExportAnnotation[];
}

async function fetchAnnotations(): Promise<ExportAnnotation[]> {
  console.log("📊 Fetching annotations from database...");

  const annotations = await prisma.annotation.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`✅ Found ${annotations.length} annotations`);

  return annotations.map((annotation) => ({
    id: annotation.id,
    videoId: annotation.videoId,
    vendorId: annotation.vendorId,
    sessionId: annotation.sessionId,
    interactionId: annotation.interactionId,
    speaker1Id: annotation.speaker1Id,
    speaker2Id: annotation.speaker2Id,
    speaker1Label: annotation.speaker1Label,
    speaker2Label: annotation.speaker2Label,
    speaker1Confidence: annotation.speaker1Confidence,
    speaker2Confidence: annotation.speaker2Confidence,
    speaker1Comments: annotation.speaker1Comments,
    speaker2Comments: annotation.speaker2Comments,
    speaker1Prosody: annotation.speaker1Prosody,
    speaker1LexicalChoice: annotation.speaker1LexicalChoice,
    speaker1TurnTaking: annotation.speaker1TurnTaking,
    speaker1Gaze: annotation.speaker1Gaze,
    speaker1FacialExpression: annotation.speaker1FacialExpression,
    speaker1Gesture: annotation.speaker1Gesture,
    speaker1Posture: annotation.speaker1Posture,
    speaker1AffectRegulation: annotation.speaker1AffectRegulation,
    speaker1InteractionalRole: annotation.speaker1InteractionalRole,
    speaker1TimingLatency: annotation.speaker1TimingLatency,
    speaker1RepairBehavior: annotation.speaker1RepairBehavior,
    speaker2Prosody: annotation.speaker2Prosody,
    speaker2LexicalChoice: annotation.speaker2LexicalChoice,
    speaker2TurnTaking: annotation.speaker2TurnTaking,
    speaker2Gaze: annotation.speaker2Gaze,
    speaker2FacialExpression: annotation.speaker2FacialExpression,
    speaker2Gesture: annotation.speaker2Gesture,
    speaker2Posture: annotation.speaker2Posture,
    speaker2AffectRegulation: annotation.speaker2AffectRegulation,
    speaker2InteractionalRole: annotation.speaker2InteractionalRole,
    speaker2TimingLatency: annotation.speaker2TimingLatency,
    speaker2RepairBehavior: annotation.speaker2RepairBehavior,
    labelingTimeMs: annotation.labelingTimeMs,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
    userEmail: annotation.user.email || "unknown",
    username: annotation.user.email?.split("@")[0] || "unknown",
  }));
}

function generateExportId(): string {
  // Generate a unique export ID with timestamp and random component
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `EXPORT-${timestamp}-${random}`.toUpperCase();
}

async function exportToJSON(
  annotations: ExportAnnotation[],
  outputDir: string,
): Promise<string> {
  const exportId = generateExportId();
  const exportDate = new Date().toISOString();

  const watermarkedData: WatermarkedExport = {
    watermark: {
      ...WATERMARK,
      exportId,
      exportDate,
      totalRecords: annotations.length,
    },
    data: annotations,
  };

  const filename = `annotations-export-${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(watermarkedData, null, 2), "utf-8");

  return filepath;
}

async function exportToCSV(
  annotations: ExportAnnotation[],
  outputDir: string,
): Promise<string> {
  const exportId = generateExportId();
  const exportDate = new Date().toISOString();

  const filename = `annotations-export-${Date.now()}.csv`;
  const filepath = path.join(outputDir, filename);

  // Create CSV header with watermark
  const watermarkHeader = [
    `# ${WATERMARK.trademark}`,
    `# ${WATERMARK.copyright}`,
    `# ${WATERMARK.license}`,
    `# Owner: ${WATERMARK.owner}`,
    `# Export ID: ${exportId}`,
    `# Export Date: ${exportDate}`,
    `# Total Records: ${annotations.length}`,
    `# ${WATERMARK.contact}`,
    "#",
  ].join("\n");

  // Flatten category arrays for CSV
  const flattenedData = annotations.map((annotation) => ({
    id: annotation.id,
    videoId: annotation.videoId,
    vendorId: annotation.vendorId,
    sessionId: annotation.sessionId,
    interactionId: annotation.interactionId,
    speaker1Id: annotation.speaker1Id,
    speaker2Id: annotation.speaker2Id,
    speaker1Label: annotation.speaker1Label,
    speaker2Label: annotation.speaker2Label,
    speaker1Confidence: annotation.speaker1Confidence,
    speaker2Confidence: annotation.speaker2Confidence,
    speaker1Comments: annotation.speaker1Comments,
    speaker2Comments: annotation.speaker2Comments,
    speaker1Prosody: annotation.speaker1Prosody.join("; "),
    speaker1LexicalChoice: annotation.speaker1LexicalChoice.join("; "),
    speaker1TurnTaking: annotation.speaker1TurnTaking.join("; "),
    speaker1Gaze: annotation.speaker1Gaze.join("; "),
    speaker1FacialExpression: annotation.speaker1FacialExpression.join("; "),
    speaker1Gesture: annotation.speaker1Gesture.join("; "),
    speaker1Posture: annotation.speaker1Posture.join("; "),
    speaker1AffectRegulation: annotation.speaker1AffectRegulation.join("; "),
    speaker1InteractionalRole: annotation.speaker1InteractionalRole.join("; "),
    speaker1TimingLatency: annotation.speaker1TimingLatency.join("; "),
    speaker1RepairBehavior: annotation.speaker1RepairBehavior.join("; "),
    speaker2Prosody: annotation.speaker2Prosody.join("; "),
    speaker2LexicalChoice: annotation.speaker2LexicalChoice.join("; "),
    speaker2TurnTaking: annotation.speaker2TurnTaking.join("; "),
    speaker2Gaze: annotation.speaker2Gaze.join("; "),
    speaker2FacialExpression: annotation.speaker2FacialExpression.join("; "),
    speaker2Gesture: annotation.speaker2Gesture.join("; "),
    speaker2Posture: annotation.speaker2Posture.join("; "),
    speaker2AffectRegulation: annotation.speaker2AffectRegulation.join("; "),
    speaker2InteractionalRole: annotation.speaker2InteractionalRole.join("; "),
    speaker2TimingLatency: annotation.speaker2TimingLatency.join("; "),
    speaker2RepairBehavior: annotation.speaker2RepairBehavior.join("; "),
    labelingTimeMs: annotation.labelingTimeMs,
    createdAt: annotation.createdAt.toISOString(),
    updatedAt: annotation.updatedAt.toISOString(),
    userEmail: annotation.userEmail,
    username: annotation.username,
  }));

  // Create CSV content
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: "id", title: "ID" },
      { id: "videoId", title: "Video ID" },
      { id: "vendorId", title: "Vendor ID" },
      { id: "sessionId", title: "Session ID" },
      { id: "interactionId", title: "Interaction ID" },
      { id: "speaker1Id", title: "Speaker 1 ID" },
      { id: "speaker2Id", title: "Speaker 2 ID" },
      { id: "speaker1Label", title: "Speaker 1 Label" },
      { id: "speaker2Label", title: "Speaker 2 Label" },
      { id: "speaker1Confidence", title: "Speaker 1 Confidence" },
      { id: "speaker2Confidence", title: "Speaker 2 Confidence" },
      { id: "speaker1Comments", title: "Speaker 1 Comments" },
      { id: "speaker2Comments", title: "Speaker 2 Comments" },
      { id: "speaker1Prosody", title: "Speaker 1 Prosody" },
      { id: "speaker1LexicalChoice", title: "Speaker 1 Lexical Choice" },
      { id: "speaker1TurnTaking", title: "Speaker 1 Turn Taking" },
      { id: "speaker1Gaze", title: "Speaker 1 Gaze" },
      { id: "speaker1FacialExpression", title: "Speaker 1 Facial Expression" },
      { id: "speaker1Gesture", title: "Speaker 1 Gesture" },
      { id: "speaker1Posture", title: "Speaker 1 Posture" },
      {
        id: "speaker1AffectRegulation",
        title: "Speaker 1 Affect Regulation",
      },
      {
        id: "speaker1InteractionalRole",
        title: "Speaker 1 Interactional Role",
      },
      { id: "speaker1TimingLatency", title: "Speaker 1 Timing Latency" },
      { id: "speaker1RepairBehavior", title: "Speaker 1 Repair Behavior" },
      { id: "speaker2Prosody", title: "Speaker 2 Prosody" },
      { id: "speaker2LexicalChoice", title: "Speaker 2 Lexical Choice" },
      { id: "speaker2TurnTaking", title: "Speaker 2 Turn Taking" },
      { id: "speaker2Gaze", title: "Speaker 2 Gaze" },
      { id: "speaker2FacialExpression", title: "Speaker 2 Facial Expression" },
      { id: "speaker2Gesture", title: "Speaker 2 Gesture" },
      { id: "speaker2Posture", title: "Speaker 2 Posture" },
      {
        id: "speaker2AffectRegulation",
        title: "Speaker 2 Affect Regulation",
      },
      {
        id: "speaker2InteractionalRole",
        title: "Speaker 2 Interactional Role",
      },
      { id: "speaker2TimingLatency", title: "Speaker 2 Timing Latency" },
      { id: "speaker2RepairBehavior", title: "Speaker 2 Repair Behavior" },
      { id: "labelingTimeMs", title: "Labeling Time (ms)" },
      { id: "createdAt", title: "Created At" },
      { id: "updatedAt", title: "Updated At" },
      { id: "userEmail", title: "User Email" },
      { id: "username", title: "Username" },
    ],
  });

  const csvContent =
    watermarkHeader +
    "\n" +
    csvStringifier.getHeaderString() +
    csvStringifier.stringifyRecords(flattenedData);

  fs.writeFileSync(filepath, csvContent, "utf-8");

  return filepath;
}

async function main() {
  const format = process.argv[2]?.toLowerCase();

  if (!format || !["json", "csv"].includes(format)) {
    console.error("❌ Usage: pnpm tsx scripts/export-annotations.ts [json|csv]");
    process.exit(1);
  }

  try {
    console.log("🚀 Starting annotation export...");
    console.log(`📄 Format: ${format.toUpperCase()}`);

    // Create exports directory if it doesn't exist
    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
      console.log(`📁 Created exports directory: ${exportDir}`);
    }

    // Fetch annotations
    const annotations = await fetchAnnotations();

    if (annotations.length === 0) {
      console.log("⚠️  No annotations found to export");
      return;
    }

    // Export based on format
    let filepath: string;
    if (format === "json") {
      filepath = await exportToJSON(annotations, exportDir);
    } else {
      filepath = await exportToCSV(annotations, exportDir);
    }

    console.log("\n✅ Export complete!");
    console.log(`📦 File saved to: ${filepath}`);
    console.log(`📊 Total records: ${annotations.length}`);
    console.log("\n⚠️  REMINDER: This data is confidential and proprietary.");
    console.log("   Do not share without explicit permission.\n");
  } catch (error) {
    console.error("❌ Error during export:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
