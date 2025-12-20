"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SynchronizedVideoPlayer, SynchronizedVideoPlayerRef } from "./synchronized-video-player";
import { Timer, Save, ArrowLeft } from "lucide-react";
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
  const [speaker1Label, setSpeaker1Label] = useState(existingAnnotation?.speaker1Label || "");
  const [speaker2Label, setSpeaker2Label] = useState(existingAnnotation?.speaker2Label || "");
  const [speaker1Confidence, setSpeaker1Confidence] = useState(existingAnnotation?.speaker1Confidence || 3);
  const [speaker2Confidence, setSpeaker2Confidence] = useState(existingAnnotation?.speaker2Confidence || 3);
  const [comments, setComments] = useState(existingAnnotation?.comments || "");
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(existingAnnotation?.labelingTimeMs || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Timer effect
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!speaker1Label || !speaker2Label) {
      setSaveError("Please select labels for both speakers");
      return;
    }

    // Stop timer and video playback
    setIsTimerRunning(false);
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
          comments,
          labelingTimeMs: elapsedTime,
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

  return (
    <div className="space-y-6">
      {/* Video Players */}
      <div className="space-y-4">
        <SynchronizedVideoPlayer
          ref={videoPlayerRef}
          video1Src={video.participant1VideoPath}
          video2Src={video.participant2VideoPath}
          participant1Label={`Participant ${video.participant1Id}`}
          participant2Label={`Participant ${video.participant2Id}`}
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
        {/* Timer */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer size={20} />
              <span className="font-semibold">Labeling Time:</span>
              <span className="font-mono text-2xl">{formatTime(elapsedTime)}</span>
            </div>
            <button
              type="button"
              onClick={toggleTimer}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                isTimerRunning
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {isTimerRunning ? "Stop" : "Start"}
            </button>
          </div>
        </div>

        {/* Labels */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Speaker 1 */}
          <div className="space-y-3">
            <label className="block font-semibold">
              Participant {video.participant1Id} Label *
            </label>
            <select
              value={speaker1Label}
              onChange={(e) => setSpeaker1Label(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              required
            >
              <option value="">Select morph...</option>
              {MORPH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Speaker 2 */}
          <div className="space-y-3">
            <label className="block font-semibold">
              Participant {video.participant2Id} Label *
            </label>
            <select
              value={speaker2Label}
              onChange={(e) => setSpeaker2Label(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              required
            >
              <option value="">Select morph...</option>
              {MORPH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Confidence (per speaker) */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Speaker 1 Confidence */}
          <div className="space-y-3">
            <label className="block font-semibold">
              Participant {video.participant1Id} Confidence: <span className="font-mono text-lg">{speaker1Confidence}</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={speaker1Confidence}
              onChange={(e) => setSpeaker1Confidence(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 - Low</span>
              <span>3</span>
              <span>5 - High</span>
            </div>
          </div>

          {/* Speaker 2 Confidence */}
          <div className="space-y-3">
            <label className="block font-semibold">
              Participant {video.participant2Id} Confidence: <span className="font-mono text-lg">{speaker2Confidence}</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={speaker2Confidence}
              onChange={(e) => setSpeaker2Confidence(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 - Low</span>
              <span>3</span>
              <span>5 - High</span>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <label className="block font-semibold">Comments</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-background min-h-[100px]"
            placeholder="Add any observations or notes..."
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
          <button
            type="submit"
            disabled={isSaving}
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
