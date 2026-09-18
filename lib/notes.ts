const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export interface NoteTextSegment {
  text: string;
  isLink: boolean;
}

/** ノート本文を URL とそれ以外に分割する。URL 部分はリンクとして描画できるようにする */
export function splitNoteText(text: string): NoteTextSegment[] {
  const segments: NoteTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, index), isLink: false });
    }
    segments.push({ text: match[0], isLink: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), isLink: false });
  }

  return segments;
}

export const UNCATEGORIZED_ID = "";
