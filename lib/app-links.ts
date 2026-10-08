/** 入力されたURLを http(s) の絶対URLに正規化する。スキームが無ければ https:// を補う。不正な場合は null */
export function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
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
