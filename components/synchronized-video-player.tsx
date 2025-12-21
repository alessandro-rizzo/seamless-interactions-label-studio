"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Play, Pause } from "lucide-react";

interface SynchronizedVideoPlayerProps {
  video1Src: string;
  video2Src: string;
  participant1Label: string;
  participant2Label: string;
  onFirstPlay?: () => void;
}

export interface SynchronizedVideoPlayerRef {
  stop: () => void;
}

export const SynchronizedVideoPlayer = forwardRef<SynchronizedVideoPlayerRef, SynchronizedVideoPlayerProps>(({
  video1Src,
  video2Src,
  participant1Label,
  participant2Label,
  onFirstPlay,
}, ref) => {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const hasPlayedRef = useRef(false);

  // Expose stop method to parent via ref
  useImperativeHandle(ref, () => ({
    stop: () => {
      const video1 = video1Ref.current;
      const video2 = video2Ref.current;

      if (video1 && video2) {
        video1.pause();
        video2.pause();
        setIsPlaying(false);
      }
    }
  }));

  useEffect(() => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    // Set volume to maximum by default
    video1.volume = 1.0;
    video2.volume = 1.0;

    const handleTimeUpdate = () => {
      setCurrentTime(video1.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(Math.max(video1.duration, video2.duration));
    };

    video1.addEventListener("timeupdate", handleTimeUpdate);
    video1.addEventListener("loadedmetadata", handleLoadedMetadata);
    video2.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video1.removeEventListener("timeupdate", handleTimeUpdate);
      video1.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video2.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  const togglePlayPause = () => {
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (!video1 || !video2) return;

    if (isPlaying) {
      video1.pause();
      video2.pause();
    } else {
      // Trigger onFirstPlay callback on first play
      if (!hasPlayedRef.current) {
        hasPlayedRef.current = true;
        onFirstPlay?.();
      }
      // Sync videos before playing
      video2.currentTime = video1.currentTime;
      video1.play();
      video2.play();
    }

    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video1 = video1Ref.current;
    const video2 = video2Ref.current;

    if (video1 && video2) {
      video1.currentTime = time;
      video2.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Video 1 */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg">{participant1Label}</h3>
          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
            <video
              ref={video1Ref}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={`/api/video?path=${encodeURIComponent(video1Src)}`} type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Video 2 */}
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg">{participant2Label}</h3>
          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
            <video
              ref={video2Ref}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={`/api/video?path=${encodeURIComponent(video2Src)}`} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      {/* Synchronized Controls */}
      <div className="p-4 border rounded-lg bg-card space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-sm font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1"
            />
            <span className="text-sm font-mono">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

SynchronizedVideoPlayer.displayName = "SynchronizedVideoPlayer";
