"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { YouTubeVideo } from "@/lib/youtube";
import { YOUTUBE_EMBED_ORIGIN, isPlayerMessage, sendListening } from "@/lib/youtube-player";

/** サムネイルを表示し、タップするとその場で動画を埋め込み再生する */
export default function YouTubeEmbed({ video, onPlay }: { video: YouTubeVideo; onPlay?: () => void }) {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // enablejsapi で外から再生・一時停止できるようにする（画面右下のボタン用）
  const params = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0", enablejsapi: "1" });
  if (typeof window !== "undefined") params.set("origin", window.location.origin);
  if (video.start > 0) params.set("start", String(video.start));

  // プレーヤーの準備ができて返事が来るまで、状態の変化を送ってもらう登録を繰り返す
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      if (iframeRef.current) sendListening(iframeRef.current, video.id);
    }, 300);
    const stop = window.setTimeout(() => window.clearInterval(timer), 15000);
    const handleMessage = (event: MessageEvent) => {
      if (isPlayerMessage(event) && event.source === iframeRef.current?.contentWindow) window.clearInterval(timer);
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
      window.removeEventListener("message", handleMessage);
    };
  }, [playing, video.id]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {playing ? (
        <iframe
          ref={iframeRef}
          src={`${YOUTUBE_EMBED_ORIGIN}/embed/${video.id}?${params.toString()}`}
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
            onPlay?.();
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
