/**
 * Secure Export Annotations Script with Steganographic Watermarking
 *
 * Embeds watermarks deep within the data structure using multiple techniques:
 * - Zero-width Unicode characters in strings
 * - Encoded metadata fields
 * - Cryptographic fingerprints
 * - Distributed hash fragments
 *
 * Usage:
 *   pnpm tsx scripts/export-annotations-secure.ts json
 *   pnpm tsx scripts/export-annotations-secure.ts csv
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { createObjectCsvStringifier } from "csv-writer";

const prisma = new PrismaClient();

// Zero-width Unicode characters for invisible watermarking
const ZERO_WIDTH_CHARS = {
  SPACE: "\u200B", // Zero-width space
  JOINER: "\u200D", // Zero-width joiner
  NON_JOINER: "\u200C", // Zero-width non-joiner
};

// Watermark configuration (still kept for legal protection, but also embedded)
const WATERMARK = {
  copyright: "© 2025 Alessandro Rizzo. All Rights Reserved.",
  license:
    "CONFIDENTIAL AND PROPRIETARY - This data is the exclusive property of Alessandro Rizzo and may not be shared, distributed, or reproduced without explicit written permission.",
  trademark: "SeamlessInteractions™ Annotation Data",
  owner: "Alessandro Rizzo",
  contact: "For licensing inquiries, contact the owner.",
};

interface ExportAnnotation {
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
  userEmail: string;
  username: string;
}

interface WatermarkedAnnotation extends ExportAnnotation {
  // Hidden fields that look like legitimate data
  _recordHash?: string; // Looks like a database hash
  _syncId?: string; // Looks like a sync identifier
  _checksum?: string; // Looks like data integrity check
}

/**
 * Generate a unique export ID
 */
function generateExportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `EXPORT-${timestamp}-${random}`.toUpperCase();
}

/**
 * Encode string into zero-width Unicode characters
 * Each character is encoded as a binary pattern using zero-width chars
 */
function encodeToZeroWidth(text: string): string {
  return text
    .split("")
    .map((char) => {
      const binary = char.charCodeAt(0).toString(2).padStart(8, "0");
      return binary
        .split("")
        .map((bit) =>
          bit === "1" ? ZERO_WIDTH_CHARS.JOINER : ZERO_WIDTH_CHARS.NON_JOINER,
        )
        .join("");
    })
    .join(ZERO_WIDTH_CHARS.SPACE);
}

/**
 * Generate a cryptographic fingerprint for the watermark
 */
function generateFingerprint(exportId: string, timestamp: string): string {
  const data = `${WATERMARK.owner}:${exportId}:${timestamp}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Split a hash into multiple fragments for distribution
 */
function fragmentHash(hash: string, parts: number = 4): string[] {
  const fragmentSize = Math.ceil(hash.length / parts);
  const fragments: string[] = [];
  for (let i = 0; i < parts; i++) {
    fragments.push(hash.substring(i * fragmentSize, (i + 1) * fragmentSize));
  }
  return fragments;
}

/**
 * Embed invisible watermark in a string using zero-width characters
 */
function embedInvisibleWatermark(text: string, watermark: string): string {
  const encoded = encodeToZeroWidth(watermark);
  // Insert at a random position in the text (but deterministically based on text length)
  const position = Math.floor(text.length * 0.618); // Golden ratio position
  return text.slice(0, position) + encoded + text.slice(position);
}

/**
 * Add steganographic watermark to annotation data
 */
function watermarkAnnotation(
  annotation: ExportAnnotation,
  exportId: string,
  exportDate: string,
  fragmentIndex: number,
  hashFragments: string[],
): WatermarkedAnnotation {
  const fingerprint = generateFingerprint(exportId, exportDate);

  // Create watermarked annotation with hidden fields
  const watermarked: WatermarkedAnnotation = {
    ...annotation,
    // Hidden fields that look legitimate but contain watermark data
    _recordHash: `${hashFragments[fragmentIndex % hashFragments.length]}`, // Fragment of fingerprint
    _syncId: `sync-${exportId.split("-")[1]}`, // Part of export ID disguised as sync ID
    _checksum: fingerprint.substring(0, 16), // First 16 chars of fingerprint
  };

  // Embed invisible watermark in comments (if they exist)
  if (watermarked.speaker1Comments) {
    watermarked.speaker1Comments = embedInvisibleWatermark(
      watermarked.speaker1Comments,
      exportId.substring(0, 8),
    );
  }
  if (watermarked.speaker2Comments) {
    watermarked.speaker2Comments = embedInvisibleWatermark(
      watermarked.speaker2Comments,
      exportId.substring(8, 16),
    );
  }

  // Embed invisible watermark in video ID
  watermarked.videoId = embedInvisibleWatermark(
    watermarked.videoId,
    WATERMARK.owner.substring(0, 4),
  );

  // Add imperceptible timing variation that encodes part of the watermark
  // Add microsecond-level variation based on export ID
  const variation = parseInt(exportId.substring(7, 10), 36) % 10;
  watermarked.labelingTimeMs = annotation.labelingTimeMs + variation / 1000;

  return watermarked;
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

async function exportToJSON(
  annotations: ExportAnnotation[],
  outputDir: string,
): Promise<string> {
  const exportId = generateExportId();
  const exportDate = new Date().toISOString();
  const fingerprint = generateFingerprint(exportId, exportDate);
  const hashFragments = fragmentHash(fingerprint, 4);

  console.log(`🔐 Export ID: ${exportId}`);
  console.log(`🔐 Fingerprint: ${fingerprint.substring(0, 16)}...`);

  // Watermark each annotation with distributed fingerprint fragments
  const watermarkedData = annotations.map((annotation, index) =>
    watermarkAnnotation(annotation, exportId, exportDate, index, hashFragments),
  );

  // Add a "metadata" object that looks like database metadata but contains watermark
  const exportData = {
    // These fields look like database/export metadata
    version: "1.0",
    schema: "annotations_v2",
    exported: exportDate,
    recordCount: watermarkedData.length,
    // Hidden: Part of export ID encoded in what looks like a DB transaction ID
    _txId: `tx-${exportId.split("-")[1]}-${exportId.split("-")[2]}`,
    // Hidden: Fingerprint disguised as a data hash
    _dataHash: fingerprint,
    // The actual data
    records: watermarkedData,
  };

  const filename = `annotations-${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), "utf-8");

  // Save watermark verification data separately (for your records only)
  const verificationData = {
    exportId,
    exportDate,
    fingerprint,
    owner: WATERMARK.owner,
    recordCount: annotations.length,
    hashFragments,
  };

  const verificationPath = path.join(
    outputDir,
    `.verification-${Date.now()}.json`,
  );
  fs.writeFileSync(
    verificationPath,
    JSON.stringify(verificationData, null, 2),
    "utf-8",
  );

  console.log(`🔐 Verification data saved to: ${verificationPath}`);
  console.log(`   (Keep this secure - it proves ownership)`);

  return filepath;
}

async function exportToCSV(
  annotations: ExportAnnotation[],
  outputDir: string,
): Promise<string> {
  const exportId = generateExportId();
  const exportDate = new Date().toISOString();
  const fingerprint = generateFingerprint(exportId, exportDate);
  const hashFragments = fragmentHash(fingerprint, 4);

  console.log(`🔐 Export ID: ${exportId}`);
  console.log(`🔐 Fingerprint: ${fingerprint.substring(0, 16)}...`);

  const filename = `annotations-${Date.now()}.csv`;
  const filepath = path.join(outputDir, filename);

  // Watermark each annotation
  const watermarkedData = annotations.map((annotation, index) =>
    watermarkAnnotation(annotation, exportId, exportDate, index, hashFragments),
  );

  // Flatten for CSV (including hidden watermark fields)
  const flattenedData = watermarkedData.map((annotation) => ({
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
    // Hidden watermark fields that look like metadata
    recordHash: annotation._recordHash || "",
    syncId: annotation._syncId || "",
    checksum: annotation._checksum || "",
  }));

  // Create CSV with hidden watermark fields
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
      // Hidden watermark fields
      { id: "recordHash", title: "Record Hash" },
      { id: "syncId", title: "Sync ID" },
      { id: "checksum", title: "Checksum" },
    ],
  });

  const csvContent =
    csvStringifier.getHeaderString() +
    csvStringifier.stringifyRecords(flattenedData);

  fs.writeFileSync(filepath, csvContent, "utf-8");

  // Save verification data
  const verificationData = {
    exportId,
    exportDate,
    fingerprint,
    owner: WATERMARK.owner,
    recordCount: annotations.length,
    hashFragments,
  };

  const verificationPath = path.join(
    outputDir,
    `.verification-${Date.now()}.json`,
  );
  fs.writeFileSync(
    verificationPath,
    JSON.stringify(verificationData, null, 2),
    "utf-8",
  );

  console.log(`🔐 Verification data saved to: ${verificationPath}`);
  console.log(`   (Keep this secure - it proves ownership)`);

  return filepath;
}

async function main() {
  const format = process.argv[2]?.toLowerCase();

  if (!format || !["json", "csv"].includes(format)) {
    console.error(
      "❌ Usage: pnpm tsx scripts/export-annotations-secure.ts [json|csv]",
    );
    process.exit(1);
  }

  try {
    console.log("🚀 Starting secure annotation export...");
    console.log(`📄 Format: ${format.toUpperCase()}`);
    console.log("🔐 Applying steganographic watermarking...");

    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
      console.log(`📁 Created exports directory: ${exportDir}`);
    }

    const annotations = await fetchAnnotations();

    if (annotations.length === 0) {
      console.log("⚠️  No annotations found to export");
      return;
    }

    let filepath: string;
    if (format === "json") {
      filepath = await exportToJSON(annotations, exportDir);
    } else {
      filepath = await exportToCSV(annotations, exportDir);
    }

    console.log("\n✅ Secure export complete!");
    console.log(`📦 File saved to: ${filepath}`);
    console.log(`📊 Total records: ${annotations.length}`);
    console.log(
      "\n🔐 WATERMARK LAYERS APPLIED:",
    );
    console.log("   • Zero-width Unicode characters (invisible)");
    console.log("   • Distributed cryptographic fingerprints");
    console.log("   • Hidden metadata fields");
    console.log("   • Timing variations");
    console.log("\n⚠️  Keep the .verification-*.json file secure!");
    console.log("   It contains proof of ownership for this export.\n");
  } catch (error) {
    console.error("❌ Error during export:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
