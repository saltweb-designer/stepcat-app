"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CornerUpLeft, Pause, Play, X } from "lucide-react";
import { useMediaPlayer } from "@/contexts/MediaPlayerContext";
import { PLAYER_STATE, YOUTUBE_EMBED_ORIGIN, isPlayerMessage, readPlayerState, sendListening } from "@/lib/youtube-player";

// 右下の小さなプレーヤーの幅と、スクロール枠の端からの余白
const MINI_WIDTH = 200;
const MINI_MARGIN = 16;

/**
 * アプリ全体で1つだけ置く YouTube プレーヤー。ページの外（レイアウト）にあるので、ページを移動しても消えない。
 * 再生を始めたカードの枠（PlayerSlot）が画面にあるときはその上にぴったり重ね、
 * 無いとき（別のページ・絞り込みでカードが消えたとき）は右下に小さく出す。
 * iframe を別の場所へ付け替えると読み込み直しになるため、要素はそのままで位置と大きさだけを変える
 */
export default function PersistentPlayer() {
  const { current, paused, togglePlayback, stop, iframeRef, setPaused } = useMediaPlayer();
  const boxRef = useRef<HTMLDivElement>(null);
  const [mini, setMini] = useState(false);
  // 小さなプレーヤーから元のページへ戻ったとき、カードが現れたらそこまでスクロールする
  const pendingJumpRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const itemId = current?.item.id;
  const videoId = current?.embed.id;

  // カードの枠の位置を毎フレーム追いかける。スクロール・開閉アニメーション・画面回転のどれでもずれないようにする
  useEffect(() => {
    if (!itemId) return;
    let frame = 0;
    const update = () => {
      const box = boxRef.current;
      const root = document.querySelector("[data-scroll-root]");
      if (box && root) {
        const slot = document.querySelector<HTMLElement>(`[data-player-slot="${itemId}"]`);
        if (slot) {
          if (pendingJumpRef.current) {
            pendingJumpRef.current = false;
            slot.closest("[data-video-id]")?.scrollIntoView({ block: "start" });
          }
          const rect = slot.getBoundingClientRect();
          Object.assign(box.style, {
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            right: "auto",
            bottom: "auto",
          });
        } else {
          const rootRect = root.getBoundingClientRect();
          Object.assign(box.style, {
            left: "auto",
            top: "auto",
            width: `${Math.min(MINI_WIDTH, rootRect.width - MINI_MARGIN * 2)}px`,
            height: "auto",
            right: `${window.innerWidth - rootRect.right + MINI_MARGIN}px`,
            bottom: `${window.innerHeight - rootRect.bottom + MINI_MARGIN}px`,
          });
        }
        box.style.visibility = "visible";
        setMini(!slot);
      }
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [itemId]);

  // プレーヤーから届く再生状態を受け取る。動画を直接タップして再生・停止した場合もここで分かる。
  // 準備ができて返事が来るまでは、状態の変化を送ってもらう登録を繰り返す
  useEffect(() => {
    if (!videoId) return;
    const timer = window.setInterval(() => {
      if (iframeRef.current) sendListening(iframeRef.current, videoId);
    }, 300);
    const stopTimer = window.setTimeout(() => window.clearInterval(timer), 15000);
    const handleMessage = (event: MessageEvent) => {
      if (!isPlayerMessage(event) || event.source !== iframeRef.current?.contentWindow) return;
      window.clearInterval(timer);
      const state = readPlayerState(event);
      if (state === PLAYER_STATE.PLAYING) setPaused(false);
      else if (state === PLAYER_STATE.PAUSED || state === PLAYER_STATE.ENDED) setPaused(true);
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stopTimer);
      window.removeEventListener("message", handleMessage);
    };
  }, [itemId, videoId, iframeRef, setPaused]);

  if (!current) return null;

  const params = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0", enablejsapi: "1", origin: window.location.origin });
  if (current.embed.start > 0) params.set("start", String(current.embed.start));

  const handleReturn = () => {
    pendingJumpRef.current = true;
    if (pathname !== current.path) router.push(current.path);
  };

  // カードに重ねるときはヘッダー（z-30）・下のナビ（z-40）より下、右下に小さく出すときはヘッダーと同じ高さにする
  return (
    <div
      ref={boxRef}
      className={`invisible fixed flex flex-col overflow-hidden rounded-xl ${mini ? "z-30 bg-gray-900 shadow-xl" : "z-10 bg-black"}`}
    >
      <div className={mini ? "relative aspect-video w-full" : "relative min-h-0 flex-1"}>
        <iframe
          key={current.item.id}
          ref={iframeRef}
          src={`${YOUTUBE_EMBED_ORIGIN}/embed/${current.embed.id}?${params.toString()}`}
          title="YouTube 動画"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      {mini && (
        <div className="flex items-center gap-1 py-1 pl-2.5 pr-1 text-white">
          <button
            type="button"
            onClick={handleReturn}
            className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-semibold hover:text-white/80"
            aria-label="再生中の動画のページへ戻る"
          >
            <CornerUpLeft className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            <span className="truncate">{current.item.title || "再生中"}</span>
          </button>
          <button
            type="button"
            onClick={togglePlayback}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/15"
            aria-label={paused ? "再生" : "一時停止"}
          >
            {paused ? <Play className="ml-0.5 h-3.5 w-3.5 fill-current" strokeWidth={2.5} /> : <Pause className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} />}
          </button>
          <button
            type="button"
            onClick={stop}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/15"
            aria-label="再生を終了"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
