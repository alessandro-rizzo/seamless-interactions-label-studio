/**
 * Create Test Export Script
 *
 * Generates representative test annotations and exports them for training pipeline development.
 * This script creates diverse annotations across multiple facets and signals,
 * then exports them to JSON or CSV format.
 *
 * Usage:
 *   pnpm tsx scripts/create-test-export.ts json
 *   pnpm tsx scripts/create-test-export.ts csv
 *   pnpm tsx scripts/create-test-export.ts json --keep-data  # Don't delete test data after export
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { createObjectCsvStringifier } from "csv-writer";

const prisma = new PrismaClient();

// Parse command line arguments
const format = process.argv[2]?.toLowerCase();
const keepData = process.argv.includes("--keep-data");

if (!format || !["json", "csv"].includes(format)) {
  console.error("❌ Please specify export format: json or csv");
  console.error(
    "Usage: pnpm tsx scripts/create-test-export.ts [json|csv] [--keep-data]",
  );
  process.exit(1);
}

// Test videos with real video ID format (5 unique videos for 5 annotations)
const testVideos = [
  {
    videoId: "V00_S0644_I00000129",
    vendorId: 0,
    sessionId: 644,
    interactionId: 129,
    participant1Id: "0799",
    participant2Id: "0800",
    label: "improvised",
    split: "dev",
    fileId1: "V00_S0644_I00000129_P0799",
    fileId2: "V00_S0644_I00000129_P0800",
  },
  {
    videoId: "V00_S0001_I00000001",
    vendorId: 0,
    sessionId: 1,
    interactionId: 1,
    participant1Id: "0001",
    participant2Id: "0002",
    label: "improvised",
    split: "train",
    fileId1: "V00_S0001_I00000001_P0001",
    fileId2: "V00_S0001_I00000001_P0002",
  },
  {
    videoId: "V00_S0001_I00000002",
    vendorId: 0,
    sessionId: 1,
    interactionId: 2,
    participant1Id: "0003",
    participant2Id: "0004",
    label: "naturalistic",
    split: "dev",
    fileId1: "V00_S0001_I00000002_P0003",
    fileId2: "V00_S0001_I00000002_P0004",
  },
  {
    videoId: "V00_S0644_I00000130",
    vendorId: 0,
    sessionId: 644,
    interactionId: 130,
    participant1Id: "0801",
    participant2Id: "0802",
    label: "improvised",
    split: "dev",
    fileId1: "V00_S0644_I00000130_P0801",
    fileId2: "V00_S0644_I00000130_P0802",
  },
  {
    videoId: "V00_S0001_I00000003",
    vendorId: 0,
    sessionId: 1,
    interactionId: 3,
    participant1Id: "0005",
    participant2Id: "0006",
    label: "improvised",
    split: "train",
    fileId1: "V00_S0001_I00000003_P0005",
    fileId2: "V00_S0001_I00000003_P0006",
  },
];

// Representative test annotations showcasing different facets and signals
const testAnnotations = [
  {
    videoId: "V00_S0644_I00000129",
    vendorId: 0,
    sessionId: 644,
    interactionId: 129,
    speaker1Id: "0799",
    speaker2Id: "0800",
    speaker1Label: "P1",
    speaker2Label: "P2",
    speaker1Confidence: 5,
    speaker2Confidence: 4,
    speaker1Comments:
      "Speaker shows clear engagement with frequent backchannels",
    speaker2Comments: "More reserved, with longer response latencies",
    // Speaker 1 - High engagement, animated interaction
    speaker1Prosody: [
      "high_pitch_variance",
      "rising_terminal",
      "volume_increase",
    ],
    speaker1LexicalChoice: [
      "certainty_terms",
      "self_references",
      "informal_register",
    ],
    speaker1TurnTaking: ["rapid_backchannels", "long_turns", "floor_holding"],
    speaker1Gaze: ["direct_gaze", "gaze_shift_frequency_high"],
    speaker1FacialExpression: ["smile", "brow_raise"],
    speaker1Gesture: [
      "expansive_gesture",
      "illustrative_gesture",
      "gesture_synchrony_high",
    ],
    speaker1Posture: [
      "forward_lean",
      "upright_posture",
      "body_orientation_direct",
    ],
    speaker1AffectRegulation: ["affect_amplification"],
    speaker1InteractionalRole: ["initiative_taking", "topic_introduction"],
    speaker1TimingLatency: [
      "response_latency_short",
      "latency_variability_low",
    ],
    speaker1RepairBehavior: ["self_correction", "rephrasing"],
    // Speaker 2 - More reserved, thoughtful responses
    speaker2Prosody: [
      "low_pitch_variance",
      "falling_terminal",
      "speech_rate_slow",
    ],
    speaker2LexicalChoice: ["hedging_terms", "modal_verbs", "formal_register"],
    speaker2TurnTaking: [
      "delayed_backchannels",
      "short_turns",
      "smooth_transition",
    ],
    speaker2Gaze: [
      "gaze_aversion",
      "downward_gaze",
      "gaze_shift_frequency_low",
    ],
    speaker2FacialExpression: ["neutral_face", "micro_smile"],
    speaker2Gesture: [
      "restricted_gesture",
      "self_touch",
      "gesture_synchrony_low",
    ],
    speaker2Posture: [
      "backward_lean",
      "collapsed_posture",
      "postural_shift_frequency_low",
    ],
    speaker2AffectRegulation: ["affect_dampening", "suppressed_expression"],
    speaker2InteractionalRole: ["responsive_following", "topic_maintenance"],
    speaker2TimingLatency: ["response_latency_long", "pause_before_response"],
    speaker2RepairBehavior: ["filled_pause", "unfilled_pause", "false_start"],
    labelingTimeMs: 145000,
    userId: null,
  },
  {
    videoId: "V00_S0001_I00000001",
    vendorId: 0,
    sessionId: 1,
    interactionId: 1,
    speaker1Id: "0001",
    speaker2Id: "0002",
    speaker1Label: "P1",
    speaker2Label: "P2",
    speaker1Confidence: 5,
    speaker2Confidence: 5,
    speaker1Comments: "Both speakers show balanced engagement",
    speaker2Comments: "Collaborative turn-taking with frequent alignment",
    // Speaker 1 - Balanced, cooperative
    speaker1Prosody: ["high_pitch_variance", "rising_terminal"],
    speaker1LexicalChoice: ["politeness_markers", "other_references"],
    speaker1TurnTaking: ["smooth_transition", "floor_yielding"],
    speaker1Gaze: ["direct_gaze", "gaze_following"],
    speaker1FacialExpression: ["smile", "brow_raise"],
    speaker1Gesture: ["illustrative_gesture", "beat_gesture", "mirroring"],
    speaker1Posture: ["upright_posture", "body_orientation_direct"],
    speaker1AffectRegulation: [],
    speaker1InteractionalRole: ["alignment_behavior", "topic_maintenance"],
    speaker1TimingLatency: ["response_latency_short"],
    speaker1RepairBehavior: [],
    // Speaker 2 - Also balanced, mirroring engagement
    speaker2Prosody: ["high_pitch_variance", "speech_rate_fast"],
    speaker2LexicalChoice: ["certainty_terms", "politeness_markers"],
    speaker2TurnTaking: ["rapid_backchannels", "smooth_transition"],
    speaker2Gaze: ["direct_gaze", "gaze_following"],
    speaker2FacialExpression: ["smile"],
    speaker2Gesture: [
      "illustrative_gesture",
      "mirroring",
      "gesture_synchrony_high",
    ],
    speaker2Posture: ["forward_lean", "body_orientation_direct"],
    speaker2AffectRegulation: [],
    speaker2InteractionalRole: ["alignment_behavior", "topic_introduction"],
    speaker2TimingLatency: [
      "response_latency_short",
      "latency_variability_low",
    ],
    speaker2RepairBehavior: ["self_correction"],
    labelingTimeMs: 89000,
    userId: null,
  },
  {
    videoId: "V00_S0001_I00000002",
    vendorId: 0,
    sessionId: 1,
    interactionId: 2,
    speaker1Id: "0003",
    speaker2Id: "0004",
    speaker1Label: "P1",
    speaker2Label: "P2",
    speaker1Confidence: 3,
    speaker2Confidence: 4,
    speaker1Comments: "Showing signs of discomfort or uncertainty",
    speaker2Comments: "More dominant in the interaction",
    // Speaker 1 - Uncertain, less comfortable
    speaker1Prosody: ["flat_intonation", "volume_decrease", "creaky_voice"],
    speaker1LexicalChoice: ["hedging_terms", "mitigators", "abstract_language"],
    speaker1TurnTaking: ["short_turns", "floor_yielding"],
    speaker1Gaze: [
      "gaze_aversion",
      "downward_gaze",
      "gaze_shift_frequency_high",
    ],
    speaker1FacialExpression: [
      "neutral_face",
      "lip_press",
      "asymmetrical_expression",
    ],
    speaker1Gesture: [
      "restricted_gesture",
      "self_touch",
      "object_manipulation",
    ],
    speaker1Posture: [
      "backward_lean",
      "collapsed_posture",
      "postural_shift_frequency_high",
    ],
    speaker1AffectRegulation: [
      "self_soothing_touch",
      "affect_dampening",
      "respiratory_control_visible",
    ],
    speaker1InteractionalRole: ["responsive_following"],
    speaker1TimingLatency: [
      "response_latency_long",
      "pause_before_response",
      "latency_variability_high",
    ],
    speaker1RepairBehavior: ["filled_pause", "false_start", "unfilled_pause"],
    // Speaker 2 - More assertive, controlling
    speaker2Prosody: ["high_pitch_variance", "volume_increase"],
    speaker2LexicalChoice: [
      "certainty_terms",
      "intensifiers",
      "self_references",
    ],
    speaker2TurnTaking: [
      "interruptions",
      "long_turns",
      "competitive_entry",
      "floor_holding",
    ],
    speaker2Gaze: ["direct_gaze", "gaze_fixation"],
    speaker2FacialExpression: ["brow_furrow", "jaw_tension"],
    speaker2Gesture: ["expansive_gesture", "beat_gesture"],
    speaker2Posture: ["forward_lean", "upright_posture", "stillness"],
    speaker2AffectRegulation: ["affect_amplification"],
    speaker2InteractionalRole: [
      "initiative_taking",
      "topic_shift",
      "counter_alignment",
    ],
    speaker2TimingLatency: ["response_latency_short"],
    speaker2RepairBehavior: [],
    labelingTimeMs: 167000,
    userId: null,
  },
  {
    videoId: "V00_S0644_I00000130",
    vendorId: 0,
    sessionId: 644,
    interactionId: 130,
    speaker1Id: "0801",
    speaker2Id: "0802",
    speaker1Label: "P1",
    speaker2Label: "P2",
    speaker1Confidence: 4,
    speaker2Confidence: 4,
    speaker1Comments: "Task-focused interaction with minimal affect",
    speaker2Comments: "Similarly task-oriented with technical register",
    // Speaker 1 - Task-focused, technical
    speaker1Prosody: ["flat_intonation", "speech_rate_fast"],
    speaker1LexicalChoice: ["concrete_language", "formal_register"],
    speaker1TurnTaking: ["smooth_transition", "long_turns"],
    speaker1Gaze: ["gaze_aversion", "gaze_fixation"],
    speaker1FacialExpression: ["neutral_face"],
    speaker1Gesture: ["restricted_gesture", "object_manipulation"],
    speaker1Posture: ["upright_posture", "stillness"],
    speaker1AffectRegulation: [],
    speaker1InteractionalRole: ["topic_introduction", "topic_maintenance"],
    speaker1TimingLatency: ["response_latency_short"],
    speaker1RepairBehavior: ["self_correction", "clarification_request"],
    // Speaker 2 - Also task-focused
    speaker2Prosody: ["flat_intonation"],
    speaker2LexicalChoice: [
      "concrete_language",
      "formal_register",
      "modal_verbs",
    ],
    speaker2TurnTaking: ["smooth_transition", "short_turns"],
    speaker2Gaze: ["gaze_aversion", "side_glance"],
    speaker2FacialExpression: ["neutral_face", "micro_smile"],
    speaker2Gesture: ["restricted_gesture"],
    speaker2Posture: ["upright_posture", "postural_shift_frequency_low"],
    speaker2AffectRegulation: [],
    speaker2InteractionalRole: ["responsive_following", "alignment_behavior"],
    speaker2TimingLatency: [
      "response_latency_short",
      "latency_variability_low",
    ],
    speaker2RepairBehavior: ["unfilled_pause", "clarification_request"],
    labelingTimeMs: 112000,
    userId: null,
  },
  {
    videoId: "V00_S0001_I00000003",
    vendorId: 0,
    sessionId: 1,
    interactionId: 3,
    speaker1Id: "0005",
    speaker2Id: "0006",
    speaker1Label: "P1",
    speaker2Label: "P2",
    speaker1Confidence: 5,
    speaker2Confidence: 3,
    speaker1Comments:
      "Animated storytelling with expressive multimodal signals",
    speaker2Comments: "Active listening with frequent backchannels",
    // Speaker 1 - Animated storyteller
    speaker1Prosody: [
      "high_pitch_variance",
      "rising_terminal",
      "elongated_vowels",
      "volume_increase",
    ],
    speaker1LexicalChoice: [
      "intensifiers",
      "concrete_language",
      "informal_register",
    ],
    speaker1TurnTaking: ["long_turns", "floor_holding"],
    speaker1Gaze: ["direct_gaze", "gaze_shift_frequency_high"],
    speaker1FacialExpression: ["smile", "brow_raise", "brow_furrow"],
    speaker1Gesture: [
      "expansive_gesture",
      "illustrative_gesture",
      "beat_gesture",
      "gesture_synchrony_high",
    ],
    speaker1Posture: ["forward_lean", "postural_shift_frequency_high"],
    speaker1AffectRegulation: ["affect_amplification"],
    speaker1InteractionalRole: ["initiative_taking", "topic_introduction"],
    speaker1TimingLatency: ["response_latency_short"],
    speaker1RepairBehavior: ["rephrasing"],
    // Speaker 2 - Active listener
    speaker2Prosody: ["low_pitch_variance"],
    speaker2LexicalChoice: ["other_references", "politeness_markers"],
    speaker2TurnTaking: ["rapid_backchannels", "short_turns", "floor_yielding"],
    speaker2Gaze: ["direct_gaze", "gaze_following"],
    speaker2FacialExpression: ["smile", "micro_smile", "brow_raise"],
    speaker2Gesture: ["restricted_gesture", "beat_gesture", "mirroring"],
    speaker2Posture: ["forward_lean", "body_orientation_direct"],
    speaker2AffectRegulation: [],
    speaker2InteractionalRole: ["responsive_following", "alignment_behavior"],
    speaker2TimingLatency: ["response_latency_short"],
    speaker2RepairBehavior: [],
    labelingTimeMs: 134000,
    userId: null,
  },
];

async function createTestData() {
  console.log("🌱 Creating test data...");

  // Get or create test user
  const testEmail = "test.annotator@example.com";
  let user = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test Annotator",
      },
    });
  }

  // Delete any existing test annotations first (to avoid unique constraint violations)
  const deleted = await prisma.annotation.deleteMany({
    where: {
      userId: user.id,
    },
  });
  if (deleted.count > 0) {
    console.log(`🧹 Deleted ${deleted.count} existing test annotations`);
  }

  // Create test videos
  for (const video of testVideos) {
    await prisma.video.upsert({
      where: { videoId: video.videoId },
      update: {},
      create: video,
    });
  }

  // Create test annotations
  const createdAnnotations = [];
  for (const annotation of testAnnotations) {
    const created = await prisma.annotation.create({
      data: {
        ...annotation,
        userId: user.id,
      },
    });
    createdAnnotations.push(created.id);
  }

  console.log(
    `✅ Created ${createdAnnotations.length} test annotations for ${testVideos.length} videos`,
  );
  return { userId: user.id, annotationIds: createdAnnotations };
}

async function exportData(format: string) {
  console.log(`📤 Exporting test data to ${format.toUpperCase()}...`);

  // Fetch annotations with user info
  const annotations = await prisma.annotation.findMany({
    where: {
      user: {
        email: "test.annotator@example.com",
      },
    },
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

  const exportData = annotations.map((annotation) => ({
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
    speaker1Comments: annotation.speaker1Comments ?? "",
    speaker2Comments: annotation.speaker2Comments ?? "",
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

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const filename = `test-export-${timestamp}.${format}`;
  const filepath = path.join(process.cwd(), "exports", filename);

  // Ensure exports directory exists
  if (!fs.existsSync(path.join(process.cwd(), "exports"))) {
    fs.mkdirSync(path.join(process.cwd(), "exports"), { recursive: true });
  }

  if (format === "json") {
    // Export as JSON with metadata
    const jsonOutput = {
      metadata: {
        exportType: "test-export",
        exportDate: new Date().toISOString(),
        totalRecords: exportData.length,
        description:
          "Representative test annotations for training pipeline development",
      },
      data: exportData,
    };

    fs.writeFileSync(filepath, JSON.stringify(jsonOutput, null, 2));
  } else if (format === "csv") {
    // Export as CSV
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: "id", title: "id" },
        { id: "videoId", title: "videoId" },
        { id: "vendorId", title: "vendorId" },
        { id: "sessionId", title: "sessionId" },
        { id: "interactionId", title: "interactionId" },
        { id: "speaker1Id", title: "speaker1Id" },
        { id: "speaker2Id", title: "speaker2Id" },
        { id: "speaker1Label", title: "speaker1Label" },
        { id: "speaker2Label", title: "speaker2Label" },
        { id: "speaker1Confidence", title: "speaker1Confidence" },
        { id: "speaker2Confidence", title: "speaker2Confidence" },
        { id: "speaker1Comments", title: "speaker1Comments" },
        { id: "speaker2Comments", title: "speaker2Comments" },
        { id: "speaker1Prosody", title: "speaker1Prosody" },
        { id: "speaker1LexicalChoice", title: "speaker1LexicalChoice" },
        { id: "speaker1TurnTaking", title: "speaker1TurnTaking" },
        { id: "speaker1Gaze", title: "speaker1Gaze" },
        { id: "speaker1FacialExpression", title: "speaker1FacialExpression" },
        { id: "speaker1Gesture", title: "speaker1Gesture" },
        { id: "speaker1Posture", title: "speaker1Posture" },
        { id: "speaker1AffectRegulation", title: "speaker1AffectRegulation" },
        {
          id: "speaker1InteractionalRole",
          title: "speaker1InteractionalRole",
        },
        { id: "speaker1TimingLatency", title: "speaker1TimingLatency" },
        { id: "speaker1RepairBehavior", title: "speaker1RepairBehavior" },
        { id: "speaker2Prosody", title: "speaker2Prosody" },
        { id: "speaker2LexicalChoice", title: "speaker2LexicalChoice" },
        { id: "speaker2TurnTaking", title: "speaker2TurnTaking" },
        { id: "speaker2Gaze", title: "speaker2Gaze" },
        { id: "speaker2FacialExpression", title: "speaker2FacialExpression" },
        { id: "speaker2Gesture", title: "speaker2Gesture" },
        { id: "speaker2Posture", title: "speaker2Posture" },
        { id: "speaker2AffectRegulation", title: "speaker2AffectRegulation" },
        {
          id: "speaker2InteractionalRole",
          title: "speaker2InteractionalRole",
        },
        { id: "speaker2TimingLatency", title: "speaker2TimingLatency" },
        { id: "speaker2RepairBehavior", title: "speaker2RepairBehavior" },
        { id: "labelingTimeMs", title: "labelingTimeMs" },
        { id: "createdAt", title: "createdAt" },
        { id: "updatedAt", title: "updatedAt" },
        { id: "userEmail", title: "userEmail" },
        { id: "username", title: "username" },
      ],
    });

    // Convert arrays to semicolon-separated strings for CSV
    const csvData = exportData.map((row) => ({
      ...row,
      speaker1Prosody: row.speaker1Prosody.join("; "),
      speaker1LexicalChoice: row.speaker1LexicalChoice.join("; "),
      speaker1TurnTaking: row.speaker1TurnTaking.join("; "),
      speaker1Gaze: row.speaker1Gaze.join("; "),
      speaker1FacialExpression: row.speaker1FacialExpression.join("; "),
      speaker1Gesture: row.speaker1Gesture.join("; "),
      speaker1Posture: row.speaker1Posture.join("; "),
      speaker1AffectRegulation: row.speaker1AffectRegulation.join("; "),
      speaker1InteractionalRole: row.speaker1InteractionalRole.join("; "),
      speaker1TimingLatency: row.speaker1TimingLatency.join("; "),
      speaker1RepairBehavior: row.speaker1RepairBehavior.join("; "),
      speaker2Prosody: row.speaker2Prosody.join("; "),
      speaker2LexicalChoice: row.speaker2LexicalChoice.join("; "),
      speaker2TurnTaking: row.speaker2TurnTaking.join("; "),
      speaker2Gaze: row.speaker2Gaze.join("; "),
      speaker2FacialExpression: row.speaker2FacialExpression.join("; "),
      speaker2Gesture: row.speaker2Gesture.join("; "),
      speaker2Posture: row.speaker2Posture.join("; "),
      speaker2AffectRegulation: row.speaker2AffectRegulation.join("; "),
      speaker2InteractionalRole: row.speaker2InteractionalRole.join("; "),
      speaker2TimingLatency: row.speaker2TimingLatency.join("; "),
      speaker2RepairBehavior: row.speaker2RepairBehavior.join("; "),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    const csvContent =
      csvStringifier.getHeaderString() +
      csvStringifier.stringifyRecords(csvData);
    fs.writeFileSync(filepath, csvContent);
  }

  console.log(`✅ Exported to: ${filepath}`);
  console.log(`📊 Total records: ${exportData.length}`);
  return filepath;
}

async function cleanupTestData() {
  console.log("🧹 Cleaning up test data...");

  // Delete test annotations
  const deleted = await prisma.annotation.deleteMany({
    where: {
      user: {
        email: "test.annotator@example.com",
      },
    },
  });

  console.log(`✅ Deleted ${deleted.count} test annotations`);
}

async function main() {
  try {
    console.log("🚀 Creating Test Export Dataset\n");
    console.log(`Format: ${format.toUpperCase()}`);
    console.log(`Keep data: ${keepData ? "Yes" : "No"}\n`);

    // Create test data
    await createTestData();

    // Export data
    const filepath = await exportData(format);

    // Clean up unless --keep-data flag is set
    if (!keepData) {
      await cleanupTestData();
      console.log(
        "\n💡 Test data has been removed. Use --keep-data flag to keep it.",
      );
    } else {
      console.log(
        "\n💡 Test data kept in database. Delete manually if needed.",
      );
    }

    console.log("\n✅ Done!");
    console.log(`\n📁 Export file: ${filepath}`);
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
