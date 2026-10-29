/**
 * YouTube 埋め込みプレーヤーを外から操作するための小さな道具。
 * 埋め込みURLに enablejsapi=1 を付けると、iframe と postMessage で命令・状態をやり取りできる
 */

export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** プレーヤーの状態（YouTube IFrame API の値）。-1:未開始 0:終了 1:再生中 2:一時停止 3:読み込み中 5:頭出し済み */
export const PLAYER_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 } as const;

function post(iframe: HTMLIFrameElement, message: Record<string, unknown>) {
  iframe.contentWindow?.postMessage(JSON.stringify(message), YOUTUBE_EMBED_ORIGIN);
}

/** 再生・一時停止などの命令を送る */
export function sendPlayerCommand(iframe: HTMLIFrameElement, func: "playVideo" | "pauseVideo") {
  post(iframe, { event: "command", func, args: [] });
}

/** 状態の変化を送ってもらうよう登録する。プレーヤーの準備ができるまでは届かないので、返事が来るまで繰り返し送る */
export function sendListening(iframe: HTMLIFrameElement, id: string) {
  post(iframe, { event: "listening", id, channel: "widget" });
}

/** プレーヤーから届いたメッセージなら true */
export function isPlayerMessage(event: MessageEvent) {
  return event.origin === YOUTUBE_EMBED_ORIGIN || event.origin === "https://www.youtube.com";
}

/** プレーヤーから届いたメッセージから再生状態を取り出す。状態が含まれていなければ null */
export function readPlayerState(event: MessageEvent): number | null {
  if (!isPlayerMessage(event) || typeof event.data !== "string") return null;
  let data: { event?: string; info?: unknown };
  try {
    data = JSON.parse(event.data);
  } catch {
    return null;
  }
  if (data.event === "onStateChange" && typeof data.info === "number") return data.info;
  if (data.event === "infoDelivery" || data.event === "initialDelivery") {
    const state = (data.info as { playerState?: unknown } | null)?.playerState;
    if (typeof state === "number") return state;
  }
  return null;
}
