"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useMediaPlayer } from "@/contexts/MediaPlayerContext";
import type { YouTubeVideo } from "@/lib/youtube";
import type { VideoDoc } from "@/lib/types";

/**
 * 動画カードのサムネイル。タップするとアプリ全体のプレーヤーで再生を始める。
 * 再生中はここを空けておき、プレーヤー本体（PersistentPlayer）がこの枠の上に重なって表示される
 */
export default function PlayerSlot({ item, embed }: { item: VideoDoc; embed: YouTubeVideo }) {
  const { current, play } = useMediaPlayer();
  const active = current?.item.id === item.id;

  return (
    <div data-player-slot={active ? item.id : undefined} className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {!active && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            play(item, embed);
          }}
          className="group absolute inset-0 h-full w-full"
          aria-label="YouTube 動画を再生"
        >
          <Image
            src={`https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg`}
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
