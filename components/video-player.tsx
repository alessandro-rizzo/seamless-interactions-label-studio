"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  label: string;
  onReady?: (video: HTMLVideoElement) => void;
}

export function VideoPlayer({ src, label, onReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && onReady) {
      onReady(videoRef.current);
    }
  }, [onReady]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-lg">{label}</h3>
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm px-4 text-center">
            <div>
              <p className="font-semibold mb-2">⚠️ Video not found</p>
              <p className="text-xs opacity-75">{src}</p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full"
            controls
            onError={() => setError("Failed to load video")}
          >
            <source src={`/api/video?path=${encodeURIComponent(src)}`} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
}
