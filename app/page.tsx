import { VideoList } from "@/components/video-list";

export default function Home() {
  return (
    <div className="h-full">
      <VideoList showStats={true} />
    </div>
  );
}
