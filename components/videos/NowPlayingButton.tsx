"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { parseYouTubeUrl } from "@/lib/youtube";
import type { VideoDoc } from "@/lib/types";

/**
 * 再生中の動画カードが画面外へスクロールされたときだけ、画面右下に小さく出るボタン。
 * 押すとその動画カードまでスクロールして戻る。矢印はカードが上下どちらにあるかを示す
 */
export default function NowPlayingButton({ video }: { video: VideoDoc }) {
  // カードが画面外にあるとき、その方向。画面内にあるときは null でボタンを隠す
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

  const handleClick = () => {
    document.querySelector(`[data-video-id="${video.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const Arrow = direction === "up" ? ArrowUp : ArrowDown;

  // スクロール枠の下端に貼り付ける。高さ0の帯の中に置き、一覧の操作を邪魔しない
  return (
    <div className="pointer-events-none sticky bottom-0 z-20 mx-auto h-0 max-w-2xl">
      <button
        type="button"
        onClick={handleClick}
        className={`pointer-events-auto absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-gray-900/90 py-1.5 pl-1.5 pr-3 text-xs font-semibold text-white shadow-lg backdrop-blur transition-all duration-200 hover:bg-gray-800 sm:right-6 ${
          direction ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
        aria-label="再生中の動画へ戻る"
        aria-hidden={!direction}
        tabIndex={direction ? 0 : -1}
      >
        {embed && (
          <span className="relative h-7 w-12 shrink-0 overflow-hidden rounded-full bg-black">
            <Image src={`https://i.ytimg.com/vi/${embed.id}/default.jpg`} alt="" fill sizes="48px" className="object-cover" />
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          再生中
        </span>
        <Arrow className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
