"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type RefObject } from "react";
import type { YouTubeVideo } from "@/lib/youtube";
import type { VideoDoc } from "@/lib/types";
import { sendPlayerCommand } from "@/lib/youtube-player";

/** 再生中の動画と、再生を始めたページ（右下の小さなプレーヤーから戻る先） */
export interface NowPlaying {
  item: VideoDoc;
  embed: YouTubeVideo;
  path: string;
}

interface MediaPlayerContextValue {
  current: NowPlaying | null;
  paused: boolean;
  play: (item: VideoDoc, embed: YouTubeVideo) => void;
  togglePlayback: () => void;
  stop: () => void;
  /** 以下はプレーヤー本体（PersistentPlayer）が使う */
  iframeRef: RefObject<HTMLIFrameElement | null>;
  setPaused: (paused: boolean) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextValue | undefined>(undefined);

/**
 * 動画・音楽・筋トレの再生をアプリ全体で1つだけ持つ。
 * プレーヤーをページの外（レイアウト）に置くことで、別のページへ移動しても再生が止まらない
 */
export function MediaPlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<NowPlaying | null>(null);
  const [paused, setPaused] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const play = useCallback((item: VideoDoc, embed: YouTubeVideo) => {
    setCurrent({ item, embed, path: window.location.pathname });
    setPaused(false);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!iframeRef.current) return;
    sendPlayerCommand(iframeRef.current, paused ? "playVideo" : "pauseVideo");
    // プレーヤーからの返事を待たずに見た目を切り替え、押した手応えをすぐ返す
    setPaused(!paused);
  }, [paused]);

  const stop = useCallback(() => setCurrent(null), []);

  return (
    <MediaPlayerContext.Provider value={{ current, paused, play, togglePlayback, stop, iframeRef, setPaused }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (!context) throw new Error("useMediaPlayer は MediaPlayerProvider の中で使ってください");
  return context;
}
