"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  SynchronizedVideoPlayer,
  SynchronizedVideoPlayerRef,
} from "./synchronized-video-player";
import { Save, ArrowLeft, Trash2, Info } from "lucide-react";
import type { VideoMetadata } from "@/lib/dataset";
import type { Annotation } from "@prisma/client";
import { FacetSelector } from "./facet-selector";
import { InfoPanel } from "./ui/info-panel";
import { getAllFacets } from "@/lib/annotation-ontology";
import type { CategoryAnnotations } from "@/types/annotations";

interface LabelingFormProps {
  video: VideoMetadata;
  existingAnnotation: Annotation | null;
}

const MORPH_OPTIONS = ["Morph A", "Morph B"];

export function LabelingForm({ video, existingAnnotation }: LabelingFormProps) {
  const router = useRouter();
  const videoPlayerRef = useRef<SynchronizedVideoPlayerRef>(null);
  const [speaker1Label, setSpeaker1Label] = useState(
    existingAnnotation?.speaker1Label || "",
  );
  const [speaker2Label, setSpeaker2Label] = useState(
    existingAnnotation?.speaker2Label || "",
  );
  const [speaker1Confidence, setSpeaker1Confidence] = useState(
    existingAnnotation?.speaker1Confidence || 3,
  );
  const [speaker2Confidence, setSpeaker2Confidence] = useState(
    existingAnnotation?.speaker2Confidence || 3,
  );
  const [speaker1Comments, setSpeaker1Comments] = useState(
    existingAnnotation?.speaker1Comments || "",
  );
  const [speaker2Comments, setSpeaker2Comments] = useState(
    existingAnnotation?.speaker2Comments || "",
  );
  const [isSaving, setIsSaving] = useState(false);

  // Category annotations state
  const [speaker1Categories, setSpeaker1Categories] = useState<
    Record<string, string[]>
  >({
    prosody: existingAnnotation?.speaker1Prosody || [],
    lexical_choice: existingAnnotation?.speaker1LexicalChoice || [],
    turn_taking: existingAnnotation?.speaker1TurnTaking || [],
    gaze: existingAnnotation?.speaker1Gaze || [],
    facial_expression: existingAnnotation?.speaker1FacialExpression || [],
    gesture: existingAnnotation?.speaker1Gesture || [],
    posture: existingAnnotation?.speaker1Posture || [],
    affect_regulation: existingAnnotation?.speaker1AffectRegulation || [],
    interactional_role: existingAnnotation?.speaker1InteractionalRole || [],
    timing_latency: existingAnnotation?.speaker1TimingLatency || [],
    repair_behavior: existingAnnotation?.speaker1RepairBehavior || [],
  });

  const [speaker2Categories, setSpeaker2Categories] = useState<
    Record<string, string[]>
  >({
    prosody: existingAnnotation?.speaker2Prosody || [],
    lexical_choice: existingAnnotation?.speaker2LexicalChoice || [],
    turn_taking: existingAnnotation?.speaker2TurnTaking || [],
    gaze: existingAnnotation?.speaker2Gaze || [],
    facial_expression: existingAnnotation?.speaker2FacialExpression || [],
    gesture: existingAnnotation?.speaker2Gesture || [],
    posture: existingAnnotation?.speaker2Posture || [],
    affect_regulation: existingAnnotation?.speaker2AffectRegulation || [],
    interactional_role: existingAnnotation?.speaker2InteractionalRole || [],
    timing_latency: existingAnnotation?.speaker2TimingLatency || [],
    repair_behavior: existingAnnotation?.speaker2RepairBehavior || [],
  });

  // Time tracking: labeling time = last morph selection time - first video play time
  const firstPlayTimeRef = useRef<number | null>(existingAnnotation ? 0 : null);
  const lastMorphSelectionTimeRef = useRef<number | null>(
    existingAnnotation ? existingAnnotation.labelingTimeMs : null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Track first video play
  const handleFirstPlay = () => {
    if (firstPlayTimeRef.current === null) {
      firstPlayTimeRef.current = Date.now();
    }
  };

  // Track morph selection time
  const handleMorphSelection =
    (setter: (value: string) => void) => (value: string) => {
      setter(value);
      if (value) {
        lastMorphSelectionTimeRef.current = Date.now();
      }
    };

  // Handle category changes
  const handleSpeaker1CategoryChange =
    (facetId: string) => (value: string[]) => {
      setSpeaker1Categories((prev) => ({ ...prev, [facetId]: value }));
    };

  const handleSpeaker2CategoryChange =
    (facetId: string) => (value: string[]) => {
      setSpeaker2Categories((prev) => ({ ...prev, [facetId]: value }));
    };

  // Calculate labeling time in milliseconds
  const calculateLabelingTime = (): number => {
    if (
      firstPlayTimeRef.current === null ||
      lastMorphSelectionTimeRef.current === null
    ) {
      return existingAnnotation?.labelingTimeMs || 0;
    }
    return lastMorphSelectionTimeRef.current - firstPlayTimeRef.current;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!speaker1Label || !speaker2Label) {
      setSaveError("Please select labels for both speakers");
      return;
    }

    // Stop video playback
    videoPlayerRef.current?.stop();

    setIsSaving(true);

    try {
      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: video.videoId,
          vendorId: video.vendorId,
          sessionId: video.sessionId,
          interactionId: video.interactionId,
          speaker1Id: video.participant1Id,
          speaker2Id: video.participant2Id,
          speaker1Label,
          speaker2Label,
          speaker1Confidence,
          speaker2Confidence,
          speaker1Comments,
          speaker2Comments,
          speaker1Categories,
          speaker2Categories,
          labelingTimeMs: calculateLabelingTime(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save annotation");
      }

      // Navigate back to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error saving annotation:", error);
      setSaveError("Failed to save annotation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingAnnotation) return;

    if (
      !confirm(
        "Are you sure you want to delete this annotation? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setSaveError(null);

    try {
      const response = await fetch(
        `/api/annotations?videoId=${encodeURIComponent(video.videoId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete annotation");
      }

      // Navigate back to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error deleting annotation:", error);
      setSaveError("Failed to delete annotation. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Video Players */}
      <div className="space-y-4">
        <SynchronizedVideoPlayer
          ref={videoPlayerRef}
          video1Src={video.participant1VideoPath}
          video2Src={video.participant2VideoPath}
          participant1Label={`V${video.vendorId} · S${video.sessionId} · I${video.interactionId} · P${video.participant1Id}`}
          participant2Label={`V${video.vendorId} · S${video.sessionId} · I${video.interactionId} · P${video.participant2Id}`}
          onFirstPlay={handleFirstPlay}
        />
      </div>

      {/* Metadata */}
      {video.metadata && (
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Metadata</h3>
          <pre className="text-xs text-muted-foreground overflow-auto max-h-40">
            {JSON.stringify(video.metadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Labeling Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Morph Labels */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Morph Labels</h3>
            <InfoPanel
              trigger={
                <button
                  type="button"
                  className="
                    text-muted-foreground hover:text-foreground
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    rounded-sm
                  "
                  aria-label="Information about Morph Labels"
                >
                  <Info size={18} />
                </button>
              }
              title="Morph Labels"
              description="Select the morph type for each speaker and rate your confidence in the classification."
              items={[
                {
                  label: "Morph A",
                  description:
                    "Select this option if the speaker exhibits characteristics associated with Morph A.",
                },
                {
                  label: "Morph B",
                  description:
                    "Select this option if the speaker exhibits characteristics associated with Morph B.",
                },
                {
                  label: "Confidence Scale (1-5)",
                  description:
                    "Rate your confidence in the morph classification: 1 = Very Low Confidence, 2 = Low Confidence, 3 = Moderate Confidence, 4 = High Confidence, 5 = Very High Confidence.",
                },
                {
                  label: "Required",
                  description:
                    "Both speakers must have a morph label selected before you can save the annotation.",
                },
              ]}
            />
          </div>

          {/* Labels and Confidence */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Speaker 1 */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {MORPH_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      handleMorphSelection(setSpeaker1Label)(option)
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      speaker1Label === option
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background hover:bg-accent"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Confidence:
                </span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={speaker1Confidence}
                  onChange={(e) =>
                    setSpeaker1Confidence(parseInt(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="font-mono w-4 text-center">
                  {speaker1Confidence}
                </span>
              </div>
            </div>

            {/* Speaker 2 */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {MORPH_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      handleMorphSelection(setSpeaker2Label)(option)
                    }
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      speaker2Label === option
                        ? "bg-primary text-primary-foreground"
                        : "border bg-background hover:bg-accent"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Confidence:
                </span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={speaker2Confidence}
                  onChange={(e) =>
                    setSpeaker2Confidence(parseInt(e.target.value))
                  }
                  className="flex-1"
                />
                <span className="font-mono w-4 text-center">
                  {speaker2Confidence}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Annotations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Category Annotations</h3>
            <InfoPanel
              trigger={
                <button
                  type="button"
                  className="
                    text-muted-foreground hover:text-foreground
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    rounded-sm
                  "
                  aria-label="Information about Category Annotations"
                >
                  <Info size={18} />
                </button>
              }
              title="Category Annotations"
              description="Closed coding system for behavioral signal annotation. Select observable signals from 11 predefined facets (98 total signals) to annotate multimodal interaction behaviors."
              items={[
                {
                  label: "What is closed coding?",
                  description:
                    "Closed coding means annotating data using a predefined, finite set of categories. Categories are fixed before annotation begins, and you choose from existing labels only.",
                },
                ...getAllFacets().map((facet) => ({
                  label: facet.label,
                  description: facet.description,
                })),
                {
                  label: "How to use",
                  description:
                    "Click any facet dropdown to see available signals with descriptions. Select multiple signals per facet. Selections are independent per speaker and facet. All category annotations are optional.",
                },
              ]}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Speaker 1 Categories */}
            <div className="space-y-4">
              {getAllFacets().map((facet) => (
                <FacetSelector
                  key={`speaker1-${facet.id}`}
                  facet={facet}
                  value={speaker1Categories[facet.id] || []}
                  onChange={handleSpeaker1CategoryChange(facet.id)}
                  disabled={isSaving || isDeleting}
                />
              ))}
            </div>

            {/* Speaker 2 Categories */}
            <div className="space-y-4">
              {getAllFacets().map((facet) => (
                <FacetSelector
                  key={`speaker2-${facet.id}`}
                  facet={facet}
                  value={speaker2Categories[facet.id] || []}
                  onChange={handleSpeaker2CategoryChange(facet.id)}
                  disabled={isSaving || isDeleting}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Grounded Theory Memos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Grounded Theory Memos</h3>
            <InfoPanel
              trigger={
                <button
                  type="button"
                  className="
                    text-muted-foreground hover:text-foreground
                    transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                    rounded-sm
                  "
                  aria-label="Information about Grounded Theory Memos"
                >
                  <Info size={18} />
                </button>
              }
              title="Grounded Theory Memos"
              description="Record observations, patterns, and insights that emerge from the data. These memos help theory emerge from systematic engagement with what you observe."
              items={[
                {
                  label: "What are memos?",
                  description:
                    "Memos are your running conversation with the data. They capture your thinking process as you observe patterns, make connections, and develop insights that go beyond predefined categories.",
                },
                {
                  label: "Theory emerges from data",
                  description:
                    "Grounded theory means you don't start with a theory—you let theory emerge from what you observe. Memos are where you record observations that might not fit existing categories but reveal important patterns.",
                },
                {
                  label: "What to record",
                  description:
                    "Document anything noteworthy: unexpected behaviors, patterns across interactions, contradictions, relationships between signals, contextual factors, or anything that doesn't fit predefined categories.",
                },
                {
                  label: "When categories don't fit",
                  description:
                    "If you observe something significant but no signal captures it, memo it here. Don't force-fit observations into categories. Your memos may reveal gaps in the ontology or new theoretical insights.",
                },
                {
                  label: "Optional but valuable",
                  description:
                    "Memos are optional but highly valuable for capturing rich qualitative insights that complement the structured category annotations.",
                },
              ]}
            />
          </div>

          {/* Comments (per speaker) */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Speaker 1 Comments */}
            <textarea
              value={speaker1Comments}
              onChange={(e) => setSpeaker1Comments(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background min-h-[200px]"
              placeholder="Record observations, patterns, unexpected behaviors, or anything noteworthy that doesn't fit predefined categories..."
            />

            {/* Speaker 2 Comments */}
            <textarea
              value={speaker2Comments}
              onChange={(e) => setSpeaker2Comments(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background min-h-[200px]"
              placeholder="Record observations, patterns, unexpected behaviors, or anything noteworthy that doesn't fit predefined categories..."
            />
          </div>
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-800">
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft size={16} />
            Back to List
          </button>
          {existingAnnotation && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isDeleting ? "Clearing..." : "Clear Annotation"}
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving || isDeleting}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Annotation"}
          </button>
        </div>
      </form>
    </div>
  );
}
