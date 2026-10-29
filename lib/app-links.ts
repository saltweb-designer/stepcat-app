import type { AppLinkDoc } from "./types";

/** 初回表示時に Firestore へ登録する関連アプリ。登録後は他のアプリと同じく編集・並び替え・削除できる */
export const defaultAppLinks: (Omit<AppLinkDoc, "order">)[] = [
  { id: "default-videos", name: "動画", href: "/videos", iconUrl: "/app-icons/videos.svg" },
  {
    id: "default-yuru-english",
    name: "Yuru-English",
    href: "https://www.yuru-english.com/",
    iconUrl: "/app-icons/yuru-english.png",
  },
  {
    id: "default-lumina-cpt",
    name: "Lumina-CPT",
    href: "https://nsca-cpt-app-nu.vercel.app/",
    iconUrl: "/app-icons/lumina-cpt.png",
  },
];

/** アプリ内のページ（/videos など）へのリンクかどうか */
export function isInternalPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * 入力されたURLを http(s) の絶対URLに正規化する。スキームが無ければ https:// を補う。
 * 「/」で始まるアプリ内のパスはそのまま返す。不正な場合は null
 */
export function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isInternalPath(trimmed)) return trimmed;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** 同じアプリかどうかを判定するためのキー。www・末尾のスラッシュ・クエリの違いは無視する */
export function appLinkKey(href: string): string {
  if (isInternalPath(href)) return href.replace(/\/+$/, "");
  try {
    const url = new URL(href);
    return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return href;
  }
}

export function getHostname(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

/** アイコン未指定の関連アプリ用に、サイトのファビコン画像URLを返す */
export function getFaviconUrl(href: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(getHostname(href))}&sz=128`;
}
