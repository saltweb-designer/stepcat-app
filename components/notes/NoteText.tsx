import { Check } from "lucide-react";
import { parseChecklistLine, splitNoteText, type ChecklistLine } from "@/lib/notes";
import { parseYouTubeUrl, type YouTubeVideo } from "@/lib/youtube";
import YouTubeEmbed from "./YouTubeEmbed";

type Block =
  | { kind: "text"; text: string }
  | { kind: "check"; item: ChecklistLine; lineIndex: number };

/** 本文を「普通の文章のかたまり」と「チェックリスト項目」に分ける */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length > 0) blocks.push({ kind: "text", text: buffer.join("\n") });
    buffer = [];
  };
  text.split("\n").forEach((line, lineIndex) => {
    const item = parseChecklistLine(line);
    if (item) {
      flush();
      blocks.push({ kind: "check", item, lineIndex });
    } else {
      buffer.push(line);
    }
  });
  flush();
  return blocks;
}

function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitNoteText(text).map((segment, index) =>
        segment.isLink ? (
          <a
            key={index}
            href={segment.text}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="break-all text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-700"
          >
            {segment.text}
          </a>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
}

/**
 * ノート本文を、URLをタップ可能なリンクとして描画しつつ、長文でもレイアウトが崩れないように表示する。
 * YouTubeのURLは動画として埋め込む。「- [ ] 」「- [x] 」で始まる行はチェックボックス付きの項目として表示し、
 * onToggleCheck を渡すとタップでチェックを切り替えられる。
 */
export default function NoteText({
  text,
  className = "",
  onToggleCheck,
}: {
  text: string;
  className?: string;
  onToggleCheck?: (lineIndex: number) => void;
}) {
  const segments = splitNoteText(text);
  const videos = new Map<string, YouTubeVideo>();
  for (const segment of segments) {
    if (!segment.isLink) continue;
    const video = parseYouTubeUrl(segment.text);
    if (video && !videos.has(video.id)) videos.set(video.id, video);
  }

  const blocks = toBlocks(text);
  const hasChecklist = blocks.some((block) => block.kind === "check");

  return (
    <>
      {hasChecklist ? (
        <div className={`flex min-w-0 flex-col text-sm leading-relaxed ${className}`}>
          {blocks.map((block, blockIndex) =>
            block.kind === "text" ? (
              <p key={`t-${blockIndex}`} className="min-w-0 whitespace-pre-wrap break-words">
                <LinkedText text={block.text} />
              </p>
            ) : (
              <div key={`c-${block.lineIndex}`} className="flex min-w-0 items-start gap-2 py-0.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={block.item.checked}
                  aria-label={block.item.text || "チェック項目"}
                  disabled={!onToggleCheck}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCheck?.(block.lineIndex);
                  }}
                  className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors disabled:cursor-default ${
                    block.item.checked
                      ? "border-gray-800 bg-gray-800 text-white"
                      : "border-gray-300 bg-white hover:border-gray-500"
                  }`}
                >
                  {block.item.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
                <span
                  className={`min-w-0 flex-1 whitespace-pre-wrap break-words ${
                    block.item.checked ? "text-gray-400 line-through" : ""
                  }`}
                >
                  <LinkedText text={block.item.text} />
                </span>
              </div>
            )
          )}
        </div>
      ) : (
        <p className={`min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed ${className}`}>
          <LinkedText text={text} />
        </p>
      )}
      {videos.size > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {[...videos.values()].map((video) => (
            <YouTubeEmbed key={video.id} video={video} />
          ))}
        </div>
      )}
    </>
  );
}
