"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { YouTubeVideo } from "@/lib/youtube";

/** サムネイルを表示し、タップするとその場で動画を埋め込み再生する */
export default function YouTubeEmbed({ video }: { video: YouTubeVideo }) {
  const [playing, setPlaying] = useState(false);
  const params = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0" });
  if (video.start > 0) params.set("start", String(video.start));

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?${params.toString()}`}
          title="YouTube 動画"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPlaying(true);
          }}
          className="group absolute inset-0 h-full w-full"
          aria-label="YouTube 動画を再生"
        >
          <Image
            src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(min-width: 640px) 600px, 100vw"
            className="object-cover transition-opacity group-hover:opacity-90"
          />
          <span className="absolute left-1/2 top-1/2 flex h-12 w-[4.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-600 shadow-lg transition-transform group-hover:scale-105">
            <Play className="h-6 w-6 fill-white text-white" strokeWidth={2} />
          </span>
        </button>
      )}
    </div>
  );
}
