import { NextRequest, NextResponse } from "next/server";
import { parseYouTubeUrl } from "@/lib/youtube";

// 動画URLから「タイトル・チャンネル名・チャンネルアイコン」を取得する。
// YouTube の oEmbed とチャンネルページはブラウザから直接読めない（CORS）ため、サーバー側で取得して返す。

const CHANNEL_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
}

/** チャンネルページの og:image（チャンネルアイコン）を取り出す。取得できなければ空文字 */
async function fetchChannelIconUrl(channelUrl: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(channelUrl);
  } catch {
    return "";
  }
  if (parsed.protocol !== "https:" || !CHANNEL_HOSTS.has(parsed.hostname)) return "";

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Accept-Language": "ja,en;q=0.8",
        // EU 圏などで同意画面にリダイレクトされるのを避ける
        Cookie: "CONSENT=YES+1",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const match =
      html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/) ??
      html.match(/<link\s+itemprop="url"\s+href="(https:\/\/yt3\.[^"]+)"/);
    // 一覧では小さく表示するだけなので、元の 900px 画像ではなく 176px 版を使う
    const iconUrl = match?.[1]?.replace(/&amp;/g, "&").replace(/=s\d+-/, "=s176-") ?? "";
    return iconUrl.startsWith("https://") ? iconUrl : "";
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  const video = parseYouTubeUrl(url);
  if (!video) {
    return NextResponse.json({ error: "YouTube の動画URLを入力してください。" }, { status: 400 });
  }

  try {
    const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "動画情報を取得できませんでした。" }, { status: 502 });
    }
    const data = (await res.json()) as OEmbedResponse;
    const channelUrl = data.author_url ?? "";
    const channelIconUrl = channelUrl ? await fetchChannelIconUrl(channelUrl) : "";

    return NextResponse.json({
      title: data.title ?? "",
      channelName: data.author_name ?? "",
      channelUrl,
      channelIconUrl,
    });
  } catch (err) {
    console.error("YouTube 動画情報の取得に失敗しました", err);
    return NextResponse.json({ error: "動画情報を取得できませんでした。" }, { status: 502 });
  }
}
