"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Pause, Play } from "lucide-react";
import { parseYouTubeUrl } from "@/lib/youtube";
import type { VideoDoc } from "@/lib/types";

/**
 * 動画を再生している間、画面右下に小さく出るボタン。
 * 再生/一時停止ボタンは常に出し、動画カードが画面外にあるときだけ、そのカードへ戻るボタンも並べる。
 * 戻るボタンの矢印はカードが上下どちらにあるかを示す
 */
export default function NowPlayingButton({
  video,
  paused,
  onTogglePlayback,
}: {
  video: VideoDoc;
  paused: boolean;
  onTogglePlayback: () => void;
}) {
  // カードが画面外にあるとき、その方向。画面内にあるときは null で戻るボタンを隠す
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const embed = parseYouTubeUrl(video.url);

  useEffect(() => {
    const card = document.querySelector<HTMLElement>(`[data-video-id="${video.id}"]`);
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setDirection(null);
        else setDirection(entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) ? "up" : "down");
      },
      // カードの動画部分がほぼ隠れたら出す
      { threshold: 0.25 },
    );
    observer.observe(card);
    return () => {
      observer.disconnect();
      setDirection(null);
    };
  }, [video.id]);

  const handleJump = () => {
    document.querySelector(`[data-video-id="${video.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const Arrow = direction === "up" ? ArrowUp : ArrowDown;

  // スクロール枠の下端に貼り付ける。高さ0の帯の中に置き、一覧の操作を邪魔しない
  return (
    <div className="pointer-events-none sticky bottom-0 z-20 mx-auto h-0 max-w-2xl">
      <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-gray-900/90 p-1 text-xs font-semibold text-white shadow-lg backdrop-blur sm:right-6">
        {direction && (
          <button
            type="button"
            onClick={handleJump}
            className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 transition-colors hover:bg-white/10"
            aria-label="再生中の動画へ戻る"
          >
            {embed && (
              <span className="relative h-7 w-12 shrink-0 overflow-hidden rounded-full bg-black">
                <Image src={`https://i.ytimg.com/vi/${embed.id}/default.jpg`} alt="" fill sizes="48px" className="object-cover" />
              </span>
            )}
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                {!paused && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${paused ? "bg-gray-400" : "bg-red-500"}`} />
              </span>
              {paused ? "停止中" : "再生中"}
            </span>
            <Arrow className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        )}
        <button
          type="button"
          onClick={onTogglePlayback}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          aria-label={paused ? "再生" : "一時停止"}
        >
          {paused ? (
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" strokeWidth={2.5} />
          ) : (
            <Pause className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}
