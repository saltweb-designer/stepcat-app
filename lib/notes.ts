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

/** チェックリスト行（例: "- [ ] 牛乳を買う" / "- [x] 牛乳を買う"）の形式 */
const CHECKLIST_LINE = /^(\s*)[-*] \[( |x|X)\] ?(.*)$/;
const CHECKLIST_PREFIX = "- [ ] ";

export interface ChecklistLine {
  checked: boolean;
  /** チェックボックスの後ろの本文 */
  text: string;
}

/** 1行がチェックリスト項目ならその内容を返す。そうでなければ null */
export function parseChecklistLine(line: string): ChecklistLine | null {
  const match = line.match(CHECKLIST_LINE);
  if (!match) return null;
  return { checked: match[2] !== " ", text: match[3] };
}

/** 本文の lineIndex 行目のチェック状態を反転した本文を返す（チェックリスト行でなければそのまま） */
export function toggleChecklistLine(text: string, lineIndex: number): string {
  const lines = text.split("\n");
  const line = lines[lineIndex];
  if (line === undefined) return text;
  const match = line.match(CHECKLIST_LINE);
  if (!match) return text;
  const nextMark = match[2] === " " ? "x" : " ";
  lines[lineIndex] = `${match[1]}- [${nextMark}] ${match[3]}`;
  return lines.join("\n");
}

/**
 * start〜end の範囲にかかる行をチェックリスト化する。すべてチェックリスト行なら逆に普通の行へ戻す。
 * 新しい本文と、変更後のカーソル（選択範囲）を返す。
 */
export function toggleChecklistPrefix(
  text: string,
  start: number,
  end: number
): { text: string; start: number; end: number } {
  const blockStart = text.lastIndexOf("\n", start - 1) + 1;
  const endNewline = text.indexOf("\n", end);
  const blockEnd = endNewline === -1 ? text.length : endNewline;
  const lines = text.slice(blockStart, blockEnd).split("\n");
  const allChecklist = lines.every((line) => CHECKLIST_LINE.test(line));

  let startDelta = 0;
  let totalDelta = 0;
  const nextLines = lines.map((line, i) => {
    let next: string;
    if (allChecklist) {
      const match = line.match(CHECKLIST_LINE)!;
      next = `${match[1]}${match[3]}`;
    } else if (CHECKLIST_LINE.test(line)) {
      next = line;
    } else {
      next = `${CHECKLIST_PREFIX}${line}`;
    }
    const delta = next.length - line.length;
    if (i === 0) startDelta = delta;
    totalDelta += delta;
    return next;
  });

  return {
    text: text.slice(0, blockStart) + nextLines.join("\n") + text.slice(blockEnd),
    start: Math.max(blockStart, start + startDelta),
    end: Math.max(blockStart, end + totalDelta),
  };
}

/**
 * チェックリスト行で改行したときの処理。次の行にもチェックボックスを付ける。
 * 本文が空の項目で改行した場合はチェックボックスを外してリストを終える。
 * チェックリスト行でなければ null（通常の改行に任せる）。
 */
export function continueChecklistOnEnter(
  text: string,
  cursor: number
): { text: string; cursor: number } | null {
  const lineStart = text.lastIndexOf("\n", cursor - 1) + 1;
  const lineEndIndex = text.indexOf("\n", cursor);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  const line = text.slice(lineStart, lineEnd);
  const match = line.match(CHECKLIST_LINE);
  if (!match) return null;
  // チェックボックス記号の途中にカーソルがある場合は通常の改行にする
  const contentStart = lineStart + line.length - match[3].length;
  if (cursor < contentStart) return null;

  if (match[3].trim() === "") {
    const next = text.slice(0, lineStart) + match[1] + text.slice(lineEnd);
    return { text: next, cursor: lineStart + match[1].length };
  }
  const insert = `\n${match[1]}${CHECKLIST_PREFIX}`;
  return { text: text.slice(0, cursor) + insert + text.slice(cursor), cursor: cursor + insert.length };
}
