import { splitNoteText } from "@/lib/notes";
import { parseYouTubeUrl, type YouTubeVideo } from "@/lib/youtube";
import YouTubeEmbed from "./YouTubeEmbed";

/** ノート本文を、URLをタップ可能なリンクとして描画しつつ、長文でもレイアウトが崩れないように表示する。YouTubeのURLは動画として埋め込む */
export default function NoteText({ text, className = "" }: { text: string; className?: string }) {
  const segments = splitNoteText(text);
  const videos = new Map<string, YouTubeVideo>();
  for (const segment of segments) {
    if (!segment.isLink) continue;
    const video = parseYouTubeUrl(segment.text);
    if (video && !videos.has(video.id)) videos.set(video.id, video);
  }

  return (
    <>
      <p className={`min-w-0 whitespace-pre-wrap break-words text-sm leading-relaxed ${className}`}>
        {segments.map((segment, index) =>
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
      </p>
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
