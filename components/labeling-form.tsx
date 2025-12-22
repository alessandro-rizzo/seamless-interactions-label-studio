"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  SynchronizedVideoPlayer,
  SynchronizedVideoPlayerRef,
} from "./synchronized-video-player";
import { Save, ArrowLeft, Trash2 } from "lucide-react";
import type { VideoMetadata } from "@/lib/dataset";
import type { Annotation } from "@prisma/client";

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
          labelingTimeMs: calculateLabelingTime(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save annotation");
      }

      // Navigate back to videos list
      router.push("/videos");
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

      // Refresh the page to show clean state
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
        {/* Labels and Confidence */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Speaker 1 */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {MORPH_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleMorphSelection(setSpeaker1Label)(option)}
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
              <span className="text-sm text-muted-foreground">Confidence:</span>
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
                  onClick={() => handleMorphSelection(setSpeaker2Label)(option)}
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
              <span className="text-sm text-muted-foreground">Confidence:</span>
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

        {/* Comments (per speaker) */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Speaker 1 Comments */}
          <textarea
            value={speaker1Comments}
            onChange={(e) => setSpeaker1Comments(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background min-h-[200px]"
            placeholder="Add observations..."
          />

          {/* Speaker 2 Comments */}
          <textarea
            value={speaker2Comments}
            onChange={(e) => setSpeaker2Comments(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background min-h-[200px]"
            placeholder="Add observations..."
          />
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
            onClick={() => router.push("/videos")}
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
