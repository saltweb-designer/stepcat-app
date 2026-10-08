const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

export interface YouTubeVideo {
  id: string;
  /** 再生開始位置（秒） */
  start: number;
}

/** "90" / "90s" / "1m30s" / "1h2m3s" 形式の t パラメータを秒数に変換する */
function parseStartTime(value: string | null): number {
  if (!value) return 0;
  if (/^\d+s?$/.test(value)) return parseInt(value, 10);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return 0;
  const [, h = "0", m = "0", sec = "0"] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(sec);
}

/** YouTube の動画URL（通常・短縮・Shorts・ライブ・埋め込み）から動画IDを取り出す。該当しなければ null */
export function parseYouTubeUrl(url: string): YouTubeVideo | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") {
    id = parsed.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else {
      const [, kind, value] = parsed.pathname.split("/");
      if (kind === "shorts" || kind === "live" || kind === "embed") id = value ?? null;
    }
  }

  if (!id || !VIDEO_ID_PATTERN.test(id)) return null;
  return { id, start: parseStartTime(parsed.searchParams.get("t") ?? parsed.searchParams.get("start")) };
}
